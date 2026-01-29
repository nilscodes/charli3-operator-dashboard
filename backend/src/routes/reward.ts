import { Router, Request, Response } from 'express';
import type { RewardService } from '@services/rewardService.js';
import logger from '../helpers/logger.js';

export function createRewardRouter(rewardService: RewardService): Router {
  const router = Router();

  router.get('/balance', async (req: Request, res: Response) => {
    try {
      const data = await rewardService.getRewardBalance();
      res.json(data);
    } catch (error) {
      logger.error({ err: error }, 'Error fetching reward balance');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/price', async (req: Request, res: Response) => {
    try {
      const data = await rewardService.getRewardPrice();
      res.json(data);
    } catch (error) {
      logger.error({ err: error }, 'Error fetching price');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  router.get('/breakdown', async (req: Request, res: Response) => {
    try {
      const data = await rewardService.getRewardBreakdownByFeed();
      res.json(data);
    } catch (error) {
      logger.error({ err: error }, 'Error fetching reward breakdown');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
