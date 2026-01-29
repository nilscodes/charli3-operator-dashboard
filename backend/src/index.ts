import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { ConfigLoader } from '@config/loader.js';
import { createDatabaseService } from '@services/database.js';
import { createPriceService } from '@services/priceService.js';
import { createNodeService } from '@services/nodeService.js';
import { createRewardService } from '@services/rewardService.js';
import { createROIService } from '@services/roiService.js';
import { authenticateApiKey } from '@middleware/auth.js';
import { createNodesRouter } from '@routes/nodes.js';
import { createRewardRouter } from '@routes/reward.js';
import { createROIRouter } from '@routes/roi.js';
import logger from './helpers/logger.js';

async function bootstrap() {
  try {
    logger.info('Loading configuration...');
    const config = ConfigLoader.load();
    logger.info('Configuration loaded successfully');

    logger.info('Initializing database connection...');
    const dbService = createDatabaseService(config.database);
    
    const isConnected = await dbService.testConnection();
    if (!isConnected) {
      throw new Error('Failed to connect to database');
    }
    logger.info('Database connected successfully');

    logger.info('Initializing price service...');
    const priceService = createPriceService(config.priceProvider.type, {
      tokenId: config.priceProvider.tokenId,
      apiKey: config.priceProvider.apiKey,
    });
    logger.info('Price service initialized');

    logger.info('Initializing business services...');
    const nodeService = createNodeService(dbService, ConfigLoader, priceService);
    const rewardService = createRewardService(dbService, priceService, ConfigLoader);
    const roiService = createROIService(nodeService, rewardService, priceService);
    logger.info('Business services initialized');

    const app = express();

    const HTTP_LOG_LEVEL = process.env.HTTP_LOG_LEVEL || 'warn';
    const httpLogger = pinoHttp({
      level: HTTP_LOG_LEVEL,
      redact: {
        paths: ['req.headers.authorization', 'req.headers.Authorization', 'req.headers.cookie'],
        censor: '***',
      },
      base: { log_type: 'http' },
      messageKey: 'message',
      ...(process.env.NODE_ENV === 'development'
        ? {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true },
            },
          }
        : {}),
      autoLogging: {
        ignore: (req: Request) => req.url === '/health' || req.url === '/health/db',
      },
      customLogLevel: (_req: Request, res: Response, err?: Error) => {
        if (res.statusCode >= 500 || err) {
          return 'error';
        }
        return 'info';
      },
    });

    app.use(httpLogger);

    app.use(helmet());
    app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
    }));

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.get('/health/db', async (_req: Request, res: Response) => {
      try {
        const isConnected = await dbService.testConnection();
        if (isConnected) {
          res.json({ 
            status: 'ok', 
            database: 'connected',
            timestamp: new Date().toISOString() 
          });
        } else {
          res.status(503).json({ 
            status: 'error', 
            database: 'disconnected',
            timestamp: new Date().toISOString() 
          });
        }
      } catch (error) {
        res.status(503).json({ 
          status: 'error', 
          database: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString() 
        });
      }
    });

    app.use('/api', authenticateApiKey);

    app.use('/api/nodes', createNodesRouter(nodeService));
    app.use('/api/reward', createRewardRouter(rewardService));
    app.use('/api/roi', createROIRouter(roiService));

    app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found' });
    });

    const errorHandler: express.ErrorRequestHandler = (err, _req, res) => {
      logger.error({ err }, 'Unhandled error');
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
      });
    };
    app.use(errorHandler);

    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      await dbService.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT signal received: closing HTTP server');
      await dbService.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
