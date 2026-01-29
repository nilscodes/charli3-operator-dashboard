import pg from 'pg';
import type { DatabaseConfig } from '../types/config.js';
import type { BalanceResult, TokenBalanceResult, TransactionResult, TransactionHistoryQuery } from '../types/database.js';
import logger from '../helpers/logger.js';

const { Pool } = pg;

export interface DatabaseService {
  testConnection(): Promise<boolean>;
  getCurrentBalance(address: string): Promise<string>;
  getLifetimeReceived(address: string, oracleScriptAddress?: string): Promise<string>;
  getLifetimeSpent(address: string): Promise<string>;
  getLifetimeSpentFiltered(address: string, oracleScriptAddress: string): Promise<string>;
  getBalanceInfo(address: string, oracleScriptAddress?: string): Promise<BalanceResult>;
  getTokenBalance(address: string, policyId: string): Promise<string>;
  getRewardTransactionsByScript(rewardAddress: string, tokenPolicy: string, oracleScriptAddress: string): Promise<{
    totalTokens: string;
    transactionCount: number;
  }>;
  getRewardTransactionTimestamps(rewardAddress: string, tokenPolicy: string, oracleScriptAddress: string): Promise<Date[]>;
  getTransactionHistory(params: TransactionHistoryQuery & { oracleScriptAddress?: string }): Promise<TransactionResult[]>;
  getTransactionStats(address: string, oracleScriptAddress?: string, fromDate?: Date, toDate?: Date): Promise<{
    count: number;
    totalSpent: string;
    totalReceived: string;
  }>;
  close(): Promise<void>;
}

export function createDatabaseService(config: DatabaseConfig): DatabaseService {
  const pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
    // 30 second timeout for long-running queries on large tables
    statement_timeout: 30000,
  });

  pool.on('error', (err) => {
    logger.error({ err }, 'Unexpected error on idle client');
  });

  return {
    async testConnection(): Promise<boolean> {
      try {
        logger.info('Testing database connection...');
        const client = await pool.connect();
        logger.info('Client acquired from pool');
        const result = await client.query('SELECT 1 as test');
        logger.info({ rows: result.rows }, 'Query executed successfully');
        client.release();
        logger.info('Client released back to pool');
        return true;
      } catch (error) {
        logger.error({ err: error }, 'Database connection test failed');
        if (error instanceof Error) {
          logger.error({ name: error.name, message: error.message, stack: error.stack }, 'Error details');
        }
        return false;
      }
    },

    async getCurrentBalance(address: string): Promise<string> {
      const query = `
        SELECT COALESCE(SUM(value), 0) as balance
        FROM tx_out
        WHERE address = $1 AND consumed_by_tx_id IS NULL
      `;

      const result = await pool.query(query, [address]);
      return result.rows[0].balance.toString();
    },

    // Only counts transactions where at least one input comes from a different address.
    // If oracleScriptAddress is provided, excludes transactions involving that script address.
    async getLifetimeReceived(address: string, oracleScriptAddress?: string): Promise<string> {
      let query = `
        SELECT COALESCE(SUM(txo.value), 0) as total
        FROM tx_out txo
        WHERE txo.address = $1
          AND EXISTS (
            -- Check if any input in this transaction comes from a different address
            SELECT 1
            FROM tx_in ti
            JOIN tx_out input_txo ON ti.tx_out_id = input_txo.tx_id AND ti.tx_out_index = input_txo.index
            WHERE ti.tx_in_id = txo.tx_id
              AND input_txo.address != $1
          )
      `;

      const queryParams: any[] = [address];

      if (oracleScriptAddress) {
        queryParams.push(oracleScriptAddress);
        const scriptParam = `$${queryParams.length}`;
        query += `
          AND NOT EXISTS (
            -- Exclude transactions involving script address in any output
            SELECT 1 FROM tx_out script_out
            WHERE script_out.tx_id = txo.tx_id 
              AND script_out.address = ${scriptParam}
          )
          AND NOT EXISTS (
            -- Exclude transactions involving script address in any input
            SELECT 1 FROM tx_in ti2
            JOIN tx_out script_in ON ti2.tx_out_id = script_in.tx_id AND ti2.tx_out_index = script_in.index
            WHERE ti2.tx_in_id = txo.tx_id
              AND script_in.address = ${scriptParam}
          )
        `;
      }

      const result = await pool.query(query, queryParams);
      return result.rows[0].total.toString();
    },

    // Sums all fees from transactions that spent from this address
    async getLifetimeSpent(address: string): Promise<string> {
      const query = `
        SELECT COALESCE(SUM(t.fee), 0) as total
        FROM tx t
        WHERE EXISTS (
          -- Check if any input in this transaction comes from the address
          SELECT 1
          FROM tx_in ti
          JOIN tx_out txo ON ti.tx_out_id = txo.tx_id AND ti.tx_out_index = txo.index
          WHERE ti.tx_in_id = t.id
            AND txo.address = $1
        )
      `;

      const result = await pool.query(query, [address]);
      return result.rows[0].total.toString();
    },

    // Only counts fees from transactions where the oracle script address appears in any output
    async getLifetimeSpentFiltered(address: string, oracleScriptAddress: string): Promise<string> {
      const query = `
        SELECT COALESCE(SUM(t.fee), 0) as total
        FROM tx t
        WHERE EXISTS (
          -- Check if any input in this transaction comes from the address
          SELECT 1
          FROM tx_in ti
          JOIN tx_out txo ON ti.tx_out_id = txo.tx_id AND ti.tx_out_index = txo.index
          WHERE ti.tx_in_id = t.id
            AND txo.address = $1
        )
        AND EXISTS (
          -- Only count if script address appears in any output
          SELECT 1 FROM tx_out output
          WHERE output.tx_id = t.id 
            AND output.address = $2
        )
      `;

      const result = await pool.query(query, [address, oracleScriptAddress]);
      return result.rows[0].total.toString();
    },

    async getBalanceInfo(address: string, oracleScriptAddress?: string): Promise<BalanceResult> {
      const currentBalance = await this.getCurrentBalance(address);
      const lifetimeReceived = await this.getLifetimeReceived(address, oracleScriptAddress);
      const lifetimeSpent = oracleScriptAddress 
        ? await this.getLifetimeSpentFiltered(address, oracleScriptAddress)
        : await this.getLifetimeSpent(address);

      return {
        address,
        currentBalance,
        lifetimeReceived,
        lifetimeSpent,
      };
    },

    async getTokenBalance(address: string, policyId: string): Promise<string> {
      const query = `
        SELECT COALESCE(SUM(ma.quantity), 0) as quantity
        FROM ma_tx_out ma
        JOIN multi_asset m ON ma.ident = m.id
        JOIN tx_out txo ON ma.tx_out_id = txo.id
        WHERE txo.address = $1 
          AND encode(m.policy, 'hex') = $2
          AND txo.consumed_by_tx_id IS NULL
      `;

      const result = await pool.query(query, [address, policyId]);
      return result.rows[0].quantity.toString();
    },

    // Finds transactions to rewardAddress where oracleScriptAddress appears in inputs
    async getRewardTransactionsByScript(
      rewardAddress: string, 
      tokenPolicy: string, 
      oracleScriptAddress: string
    ): Promise<{ totalTokens: string; transactionCount: number }> {
      const query = `
        SELECT 
          COALESCE(SUM(ma.quantity), 0) as total_tokens,
          COUNT(DISTINCT t.id) as tx_count
        FROM tx t
        JOIN tx_out txo ON t.id = txo.tx_id
        JOIN ma_tx_out ma ON txo.id = ma.tx_out_id
        JOIN multi_asset m ON ma.ident = m.id
        WHERE txo.address = $1
          AND encode(m.policy, 'hex') = $2
          AND EXISTS (
            -- Check if oracle script address appears in any input
            SELECT 1 FROM tx_in ti
            JOIN tx_out input_txo ON ti.tx_out_id = input_txo.tx_id AND ti.tx_out_index = input_txo.index
            WHERE ti.tx_in_id = t.id
              AND input_txo.address = $3
          )
      `;

      const result = await pool.query(query, [rewardAddress, tokenPolicy, oracleScriptAddress]);
      return {
        totalTokens: result.rows[0].total_tokens.toString(),
        transactionCount: parseInt(result.rows[0].tx_count),
      };
    },

    // Returns array of transaction timestamps ordered from oldest to newest
    async getRewardTransactionTimestamps(
      rewardAddress: string,
      tokenPolicy: string,
      oracleScriptAddress: string
    ): Promise<Date[]> {
      const query = `
        SELECT DISTINCT b.time as block_time
        FROM tx t
        JOIN block b ON t.block_id = b.id
        JOIN tx_out txo ON t.id = txo.tx_id
        JOIN ma_tx_out ma ON txo.id = ma.tx_out_id
        JOIN multi_asset m ON ma.ident = m.id
        WHERE txo.address = $1
          AND encode(m.policy, 'hex') = $2
          AND EXISTS (
            SELECT 1 FROM tx_in ti
            JOIN tx_out input_txo ON ti.tx_out_id = input_txo.tx_id AND ti.tx_out_index = input_txo.index
            WHERE ti.tx_in_id = t.id
              AND input_txo.address = $3
          )
        ORDER BY b.time ASC
      `;

      const result = await pool.query(query, [rewardAddress, tokenPolicy, oracleScriptAddress]);
      return result.rows.map(row => row.block_time);
    },

    // If oracleScriptAddress is provided, only shows transactions involving that script
    async getTransactionHistory(params: TransactionHistoryQuery & { oracleScriptAddress?: string }): Promise<TransactionResult[]> {
      let query = `
        SELECT DISTINCT
          encode(t.hash, 'hex') as tx_hash,
          b.time as block_time,
          t.fee as value,
          0 as tx_index
        FROM tx t
        JOIN block b ON t.block_id = b.id
        JOIN tx_in ti ON t.id = ti.tx_in_id
        JOIN tx_out txo ON ti.tx_out_id = txo.tx_id AND ti.tx_out_index = txo.index
        WHERE txo.address = $1
      `;

      const queryParams: any[] = [params.address];

      if (params.oracleScriptAddress) {
        queryParams.push(params.oracleScriptAddress);
        query += `
          AND EXISTS (
            SELECT 1 FROM tx_out output
            WHERE output.tx_id = t.id 
              AND output.address = $${queryParams.length}
          )
        `;
      }

      if (params.fromDate) {
        queryParams.push(params.fromDate);
        query += ` AND b.time >= $${queryParams.length}`;
      }

      if (params.toDate) {
        queryParams.push(params.toDate);
        query += ` AND b.time <= $${queryParams.length}`;
      }

      query += ' ORDER BY b.time DESC';

      // Only apply limit if no date filters (to prevent accidentally returning too much data)
      if (!params.fromDate && !params.toDate) {
        query += ' LIMIT 1000';
      }

      const result = await pool.query(query, queryParams);

      return result.rows.map((row) => ({
        txHash: row.tx_hash,
        blockTime: row.block_time,
        value: row.value.toString(),
        txIndex: row.tx_index,
      }));
    },

    async getTransactionStats(
      address: string, 
      oracleScriptAddress?: string,
      fromDate?: Date, 
      toDate?: Date
    ): Promise<{
      count: number;
      totalSpent: string;
      totalReceived: string;
    }> {
      let feesQuery = `
        SELECT COALESCE(SUM(t.fee), 0) as total_fees
        FROM tx t
        JOIN block b ON t.block_id = b.id
        WHERE EXISTS (
          -- Check if any input in this transaction comes from the address
          SELECT 1
          FROM tx_in ti
          JOIN tx_out txo ON ti.tx_out_id = txo.tx_id AND ti.tx_out_index = txo.index
          WHERE ti.tx_in_id = t.id
            AND txo.address = $1
        )
      `;

      let receivedQuery = `
        SELECT 
          COUNT(DISTINCT t.id) as tx_count,
          COALESCE(SUM(txo.value), 0) as total_received
        FROM tx t
        JOIN block b ON t.block_id = b.id
        JOIN tx_out txo ON t.id = txo.tx_id
        WHERE txo.address = $1
          AND EXISTS (
            SELECT 1
            FROM tx_in ti
            JOIN tx_out input_txo ON ti.tx_out_id = input_txo.tx_id AND ti.tx_out_index = input_txo.index
            WHERE ti.tx_in_id = txo.tx_id
              AND input_txo.address != $1
          )
      `;

      const queryParams: any[] = [address];

      if (oracleScriptAddress) {
        queryParams.push(oracleScriptAddress);
        const scriptParam = `$${queryParams.length}`;
        
        feesQuery += `
          AND EXISTS (
            SELECT 1 FROM tx_out output
            WHERE output.tx_id = t.id 
              AND output.address = ${scriptParam}
          )
        `;

        receivedQuery += `
          AND NOT EXISTS (
            SELECT 1 FROM tx_out script_out
            WHERE script_out.tx_id = txo.tx_id 
              AND script_out.address = ${scriptParam}
          )
          AND NOT EXISTS (
            SELECT 1 FROM tx_in ti2
            JOIN tx_out script_in ON ti2.tx_out_id = script_in.tx_id AND ti2.tx_out_index = script_in.index
            WHERE ti2.tx_in_id = txo.tx_id
              AND script_in.address = ${scriptParam}
          )
        `;
      }

      if (fromDate) {
        queryParams.push(fromDate);
        feesQuery += ` AND b.time >= $${queryParams.length}`;
        receivedQuery += ` AND b.time >= $${queryParams.length}`;
      }

      if (toDate) {
        queryParams.push(toDate);
        feesQuery += ` AND b.time <= $${queryParams.length}`;
        receivedQuery += ` AND b.time <= $${queryParams.length}`;
      }

      const [feesResult, receivedResult] = await Promise.all([
        pool.query(feesQuery, queryParams),
        pool.query(receivedQuery, queryParams),
      ]);

      return {
        count: parseInt(receivedResult.rows[0].tx_count),
        totalSpent: feesResult.rows[0].total_fees.toString(),
        totalReceived: receivedResult.rows[0].total_received.toString(),
      };
    },

    async close(): Promise<void> {
      await pool.end();
    }
  };
}
