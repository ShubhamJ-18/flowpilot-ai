import { logger } from '../utils/logger.js';
import { isDev } from '../config/env.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || (err.status ? err.status : 500);
  const message = err.message || 'Internal Server Error';

  logger.error(`[${req.method} ${req.originalUrl}] ${message}`, err, {
    statusCode,
    userId: req.user?.id,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode === 500 && !isDev ? 'An unexpected server error occurred' : message,
      details: err.details || (isDev && err.errors ? err.errors : null),
      ...(isDev && { stack: err.stack }),
    },
  });
}
