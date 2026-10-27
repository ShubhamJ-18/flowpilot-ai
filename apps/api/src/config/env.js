import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root monorepo directory
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config(); // fallback

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4001').transform(v => parseInt(v, 10)),
  API_URL: z.string().default('http://localhost:4001'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  TEST_DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_COOKIE_NAME: z.string().default('flowpilot_session'),
  SESSION_MAX_AGE_HOURS: z.string().default('24').transform(v => parseInt(v, 10)),
  SESSION_SECURE_COOKIE: z.string().default('false').transform(v => v === 'true'),
  SESSION_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters'),
  AI_SERVICE_URL: z.string().default('http://localhost:8001'),
  RATE_LIMIT_WINDOW_MINUTES: z.string().default('15').transform(v => parseInt(v, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('2000').transform(v => parseInt(v, 10)),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.string().default('200').transform(v => parseInt(v, 10)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDev = env.NODE_ENV === 'development';
