import { Router, Request, Response } from 'express';
import { DatabaseService } from '@services/database.js';
import { IPriceService } from '@services/priceService.js';
import { ConfigLoader } from '@config/loader.js';
import logger from '../helpers/logger.js';

export function createRewardRouter(dbService: DatabaseService, priceService: IPriceService): Router {
  const router = Router();

  /**
   * GET /api/reward/balance
   * Get token balance for the configured reward address
   */
  router.get('/balance', async (req: Request, res: Response) => {
    try {
      const config = ConfigLoader.config;
      const balance = await dbService.getTokenBalance(config.rewardAddress, config.tokenPolicy);

      res.json({
        address: config.rewardAddress,
        policyId: config.tokenPolicy,
        balance,
      });
    } catch (error) {
      logger.error({ err: error }, 'Error fetching reward balance');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /api/reward/price
   * Get current token price from configured price provider
   */
  router.get('/price', async (req: Request, res: Response) => {
    try {
      const config = ConfigLoader.config;
      const price = await priceService.getPrice(config.priceProvider.tokenId);

      res.json({
        tokenId: config.priceProvider.tokenId,
        price,
        currency: 'USD',
        provider: config.priceProvider.type,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error({ err: error }, 'Error fetching price');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}

