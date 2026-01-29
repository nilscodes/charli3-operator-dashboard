import { Router, Request, Response } from 'express';
import type { NodeService } from '@services/nodeService.js';
import { validateDto } from '@middleware/validation.js';
import { AddressParamDto } from '@dto/AddressParamDto.js';
import { TransactionHistoryQueryDto } from '@dto/TransactionHistoryQueryDto.js';
import logger from '../helpers/logger.js';

export function createNodesRouter(nodeService: NodeService): Router {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    try {
      const data = await nodeService.getAllNodesWithBalances();
      res.json(data);
    } catch (error) {
      logger.error({ err: error }, 'Error fetching nodes');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get(
    '/:address/balance',
    validateDto(AddressParamDto, 'params'),
    async (req: Request, res: Response) => {
      try {
        const { address } = req.params as { address: string };
        const balance = await nodeService.getNodeBalance(address);
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

        const data = await nodeService.getNodeTransactionHistory(address, fromDate, toDate);
        res.json(data);
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
