import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './config/prisma.js';
import { initializeScheduler } from './workers/scheduler.js';

const PORT = env.PORT || 4001;

const server = app.listen(PORT, async () => {
  logger.info(`🚀 FlowPilot AI API server running on port ${PORT} [${env.NODE_ENV}]`);
  logger.info(`🔗 Base URL: ${env.API_URL}`);

  try {
    await prisma.$connect();
    logger.info('🐘 Connected to PostgreSQL database via Prisma.');
  } catch (err) {
    logger.error('Failed to connect to database on startup:', err);
  }

  // Initialize background cron scheduler
  await initializeScheduler();
});

// Graceful shutdown handling
function handleGracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect().catch(() => {});
    logger.info('Database connections closed. Exiting process.');
    process.exit(0);
  });

  // Force exit after 10 seconds if hanging
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
