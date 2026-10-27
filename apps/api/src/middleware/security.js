import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { env, isProduction } from '../config/env.js';

export const helmetMiddleware = helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
});

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, tests)
    if (!origin) return callback(null, true);

    const allowed = [env.WEB_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'];
    if (allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: { success: false, error: { message: 'Too many requests from this IP, please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  message: { success: false, error: { message: 'Too many authentication attempts. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});

export const aiGenerateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 generation requests per minute
  message: { success: false, error: { message: 'Workflow generation rate limit reached. Please wait a moment.' } },
});
