import express from 'express';
import cookieParser from 'cookie-parser';
import { helmetMiddleware, corsMiddleware, globalLimiter } from './middleware/security.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';
import workflowsRoutes from './modules/workflows/workflows.routes.js';
import runsRoutes from './modules/runs/runs.routes.js';
import approvalsRoutes from './modules/approvals/approvals.routes.js';
import integrationsRoutes from './modules/integrations/integrations.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';

export const app = express();

// Security and utility middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(globalLimiter);

// Health check endpoint
app.get(['/health', '/api/v1/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'FlowPilot AI API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount versioned API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workflows', workflowsRoutes);
app.use('/api/v1/runs', runsRoutes);
app.use('/api/v1/approvals', approvalsRoutes);
app.use('/api/v1/integrations', integrationsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Catch-all 404 handler
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl} - Route not found`, 404));
});

// Centralized error handler
app.use(errorHandler);
