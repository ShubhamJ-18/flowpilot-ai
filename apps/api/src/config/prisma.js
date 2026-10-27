import { PrismaClient } from '@prisma/client';
import { env, isTest, isDev } from './env.js';

const dbUrl = isTest && env.TEST_DATABASE_URL ? env.TEST_DATABASE_URL : env.DATABASE_URL;

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
  log: isDev ? ['warn', 'error'] : ['error'],
});
