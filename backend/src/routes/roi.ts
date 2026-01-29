import { Router, Request, Response } from 'express';
import type { ROIService } from '@services/roiService.js';
import logger from '../helpers/logger.js';

export function createROIRouter(roiService: ROIService): Router {
  const router = Router();

  router.get('/summary', async (req: Request, res: Response) => {
    try {
      const data = await roiService.getROISummary();
      res.json(data);
    } catch (error) {
      logger.error({ err: error }, 'Error fetching ROI summary');
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
