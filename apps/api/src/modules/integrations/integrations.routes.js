import { Router } from 'express';
import { z } from 'zod';
import { integrationsController } from './integrations.controller.js';
import { validateRequest } from '../../middleware/validator.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

const createIntegrationSchema = z.object({
  provider: z.enum(['WEBHOOK', 'SLACK', 'EMAIL', 'CUSTOM']),
  displayName: z.string().min(2).max(100),
  credentials: z.record(z.string(), z.any()).refine(obj => Object.keys(obj).length > 0, 'Credentials object required'),
});

router.use(requireAuth);

router.get('/', integrationsController.list);
router.post('/', validateRequest({ body: createIntegrationSchema }), integrationsController.create);
router.delete('/:id', integrationsController.delete);

export default router;
