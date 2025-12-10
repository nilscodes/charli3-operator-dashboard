import { Request, Response, NextFunction } from 'express';
import { ConfigLoader } from '@config/loader.js';

/**
 * Middleware to verify API key authentication
 */
export function authenticateApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required. Please provide it in the X-API-Key header.',
    });
    return;
  }

  const config = ConfigLoader.config;
  const isValidKey = config.apiKeys.includes(apiKey);

  if (!isValidKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key.',
    });
    return;
  }

  next();
}

