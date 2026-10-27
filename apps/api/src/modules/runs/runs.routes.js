import { Router } from 'express';
import { z } from 'zod';
import { runsController } from './runs.controller.js';
import { validateRequest } from '../../middleware/validator.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

const triggerRunSchema = z.object({
  workflowId: z.string().uuid('Valid workflow UUID required'),
  input: z.record(z.string(), z.any()).optional().default({}),
  idempotencyKey: z.string().max(100).optional(),
});

router.use(requireAuth);

router.post('/', validateRequest({ body: triggerRunSchema }), runsController.trigger);
router.get('/', runsController.list);
router.get('/:id', runsController.getById);
router.post('/:id/cancel', runsController.cancel);
router.post('/:id/retry', runsController.retry);

export default router;
