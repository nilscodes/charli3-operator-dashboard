import { pino } from 'pino';

const SERVICE_LOG_LEVEL = process.env.SERVICE_LOG_LEVEL || 'info';

const logger = pino({
  level: SERVICE_LOG_LEVEL,
  base: { log_type: 'service' },
  messageKey: 'message',
  ...(process.env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      }
    : {}),
});

export default logger;

