import { Router } from 'express';
import { analyticsController } from './analytics.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/dashboard', analyticsController.getDashboard);

export default router;
