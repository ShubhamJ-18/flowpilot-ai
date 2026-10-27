import { Router } from 'express';
import { z } from 'zod';
import { workflowsController } from './workflows.controller.js';
import { validateRequest } from '../../middleware/validator.js';
import { requireAuth } from '../../middleware/auth.js';
import { aiGenerateLimiter } from '../../middleware/security.js';

const router = Router();

const createWorkflowSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  description: z.string().max(500).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  definition: z.object({
    nodes: z.array(z.any()).min(1, 'At least one node required'),
    edges: z.array(z.any()).default([]),
  }),
});

const updateWorkflowSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(),
  definition: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  }).optional(),
});

const validateGraphSchema = z.object({
  definition: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  }),
});

const generateWorkflowSchema = z.object({
  prompt: z.string().min(5, 'Description prompt must be at least 5 characters').max(2000),
});

router.use(requireAuth);

router.get('/', workflowsController.list);
router.post('/', validateRequest({ body: createWorkflowSchema }), workflowsController.create);
router.post('/validate', validateRequest({ body: validateGraphSchema }), workflowsController.validate);
router.post('/generate', aiGenerateLimiter, validateRequest({ body: generateWorkflowSchema }), workflowsController.generate);

router.get('/:id', workflowsController.getById);
router.put('/:id', validateRequest({ body: updateWorkflowSchema }), workflowsController.update);
router.delete('/:id', workflowsController.delete);
router.get('/:id/versions', workflowsController.listVersions);

export default router;
