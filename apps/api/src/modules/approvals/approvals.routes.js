import { Router } from 'express';
import { approvalsController } from './approvals.controller.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/pending', approvalsController.listPending);
router.post('/:runId/approve', approvalsController.approve);
router.post('/:runId/reject', approvalsController.reject);

export default router;
