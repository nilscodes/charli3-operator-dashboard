import pg from 'pg';
import type { DatabaseConfig } from '../types/config.js';
import type { BalanceResult, TokenBalanceResult, TransactionResult, TransactionHistoryQuery } from '../types/database.js';
import logger from '../helpers/logger.js';

const { Pool } = pg;

export class DatabaseService {
  private pool: pg.Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 20000,
      // Set statement timeout to 30 seconds for long-running queries on large tables
      statement_timeout: 30000,
    });

    // Test connection on initialization
    this.pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected error on idle client');
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      logger.info('Testing database connection...');
      const client = await this.pool.connect();
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
  }

  /**
   * Get current balance for an address (sum of unspent UTxOs)
   */
  async getCurrentBalance(address: string): Promise<string> {
    const query = `
      SELECT COALESCE(SUM(value), 0) as balance
      FROM tx_out
      WHERE address = $1 AND consumed_by_tx_id IS NULL
    `;

    const result = await this.pool.query(query, [address]);
    return result.rows[0].balance.toString();
  }

  /**
   * Get lifetime received amount for an address
   */
  async getLifetimeReceived(address: string): Promise<string> {
    const query = `
      SELECT COALESCE(SUM(value), 0) as total
      FROM tx_out
      WHERE address = $1
    `;

    const result = await this.pool.query(query, [address]);
    return result.rows[0].total.toString();
  }

  /**
   * Get lifetime spent amount for an address
   */
  async getLifetimeSpent(address: string): Promise<string> {
    const query = `
      SELECT COALESCE(SUM(value), 0) as total
      FROM tx_out
      WHERE address = $1 AND consumed_by_tx_id IS NOT NULL
    `;

    const result = await this.pool.query(query, [address]);
    return result.rows[0].total.toString();
  }

  /**
   * Get all balance information for an address
   */
  async getBalanceInfo(address: string): Promise<BalanceResult> {
    const [currentBalance, lifetimeReceived, lifetimeSpent] = await Promise.all([
      this.getCurrentBalance(address),
      this.getLifetimeReceived(address),
      this.getLifetimeSpent(address),
    ]);

    return {
      address,
      currentBalance,
      lifetimeReceived,
      lifetimeSpent,
    };
  }

  /**
   * Get token balance for an address with specific policy ID
   */
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

    const result = await this.pool.query(query, [address, policyId]);
    return result.rows[0].quantity.toString();
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(params: TransactionHistoryQuery): Promise<TransactionResult[]> {
    let query = `
      SELECT 
        encode(t.hash, 'hex') as tx_hash,
        b.time as block_time,
        txo.value,
        txo.index as tx_index
      FROM tx t
      JOIN block b ON t.block_id = b.id
      JOIN tx_out txo ON t.id = txo.tx_id
      WHERE txo.address = $1
    `;

    const queryParams: any[] = [params.address];

    if (params.fromDate) {
      queryParams.push(params.fromDate);
      query += ` AND b.time >= $${queryParams.length}`;
    }

    if (params.toDate) {
      queryParams.push(params.toDate);
      query += ` AND b.time <= $${queryParams.length}`;
    }

    query += ' ORDER BY b.time DESC LIMIT 1000';

    const result = await this.pool.query(query, queryParams);

    return result.rows.map((row) => ({
      txHash: row.tx_hash,
      blockTime: row.block_time,
      value: row.value.toString(),
      txIndex: row.tx_index,
    }));
  }

  /**
   * Get transaction count and total spent in a time window
   */
  async getTransactionStats(address: string, fromDate?: Date, toDate?: Date): Promise<{
    count: number;
    totalSpent: string;
    totalReceived: string;
  }> {
    let query = `
      SELECT 
        COUNT(DISTINCT t.id) as tx_count,
        COALESCE(SUM(CASE WHEN txo.consumed_by_tx_id IS NOT NULL THEN txo.value ELSE 0 END), 0) as total_spent,
        COALESCE(SUM(txo.value), 0) as total_received
      FROM tx t
      JOIN block b ON t.block_id = b.id
      JOIN tx_out txo ON t.id = txo.tx_id
      WHERE txo.address = $1
    `;

    const queryParams: any[] = [address];

    if (fromDate) {
      queryParams.push(fromDate);
      query += ` AND b.time >= $${queryParams.length}`;
    }

    if (toDate) {
      queryParams.push(toDate);
      query += ` AND b.time <= $${queryParams.length}`;
    }

    const result = await this.pool.query(query, queryParams);

    return {
      count: parseInt(result.rows[0].tx_count),
      totalSpent: result.rows[0].total_spent.toString(),
      totalReceived: result.rows[0].total_received.toString(),
    };
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

