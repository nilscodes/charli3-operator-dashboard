import { Router, Request, Response } from 'express';
import { DatabaseService } from '@services/database.js';
import { ConfigLoader } from '@config/loader.js';
import { validateDto } from '@middleware/validation.js';
import { AddressParamDto } from '@dto/AddressParamDto.js';
import { TransactionHistoryQueryDto } from '@dto/TransactionHistoryQueryDto.js';
import logger from '../helpers/logger.js';

export function createNodesRouter(dbService: DatabaseService): Router {
  const router = Router();

  /**
   * GET /api/nodes
   * Get all configured nodes with their current balances and threshold status
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const config = ConfigLoader.config;
      const nodes = config.nodes;

      const nodeData = await Promise.all(
        nodes.map(async (node) => {
          const balance = await dbService.getBalanceInfo(node.address);
          const currentBalanceLovelace = BigInt(balance.currentBalance);
          const thresholdLovelace = BigInt(config.adaThreshold);
          const isBelowThreshold = currentBalanceLovelace < thresholdLovelace;

          return {
            address: node.address,
            pair: node.pair,
            currentBalance: balance.currentBalance,
            lifetimeReceived: balance.lifetimeReceived,
            lifetimeSpent: balance.lifetimeSpent,
            isBelowThreshold,
            threshold: config.adaThreshold.toString(),
          };
        })
      );

      res.json({
        nodes: nodeData,
        adaThreshold: config.adaThreshold.toString(),
      });
    } catch (error) {
      logger.error({ err: error }, 'Error fetching nodes');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/nodes/:address/balance
   * Get detailed balance information for a specific node address
   */
  router.get(
    '/:address/balance',
    validateDto(AddressParamDto, 'params'),
    async (req: Request, res: Response) => {
      try {
        const { address } = req.params as { address: string };
        const balance = await dbService.getBalanceInfo(address);

        res.json(balance);
      } catch (error) {
        logger.error({ err: error }, 'Error fetching balance');
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /api/nodes/:address/transactions
   * Get transaction history for a specific node address
   * Query params: fromDate (ISO string), toDate (ISO string)
   */
  router.get(
    '/:address/transactions',
    validateDto(AddressParamDto, 'params'),
    validateDto(TransactionHistoryQueryDto, 'query'),
    async (req: Request, res: Response) => {
      try {
        const { address } = req.params as { address: string };
        const queryDto = req.query as TransactionHistoryQueryDto;

        const fromDate = queryDto.fromDate ? new Date(queryDto.fromDate) : undefined;
        const toDate = queryDto.toDate ? new Date(queryDto.toDate) : undefined;

        const [transactions, stats] = await Promise.all([
          dbService.getTransactionHistory({ address, fromDate, toDate }),
          dbService.getTransactionStats(address, fromDate, toDate),
        ]);

        res.json({
          address,
          fromDate: fromDate?.toISOString(),
          toDate: toDate?.toISOString(),
          transactions,
          stats,
        });
      } catch (error) {
        logger.error({ err: error }, 'Error fetching transactions');
        res.status(500).json({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  return router;
}

