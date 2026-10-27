import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { enqueueWorkflowRun } from '../../workers/queue.js';
import { logger } from '../../utils/logger.js';

export const approvalsController = {
  async listPending(req, res, next) {
    try {
      const pendingRuns = await prisma.workflowRun.findMany({
        where: {
          triggeredBy: req.user.id,
          status: 'WAITING_FOR_APPROVAL',
        },
        include: {
          workflow: { select: { id: true, name: true } },
          stepRuns: {
            where: { nodeType: 'APPROVAL_GATE', status: 'RUNNING' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.status(200).json({ success: true, data: { pendingRuns } });
    } catch (err) {
      next(err);
    }
  },

  async approve(req, res, next) {
    try {
      const { runId } = req.params;
      const { comment = 'Approved' } = req.body;

      const run = await prisma.workflowRun.findFirst({
        where: { id: runId, triggeredBy: req.user.id },
      });

      if (!run) {
        throw new AppError('Workflow run not found or access denied', 404);
      }

      if (run.status !== 'WAITING_FOR_APPROVAL') {
        throw new AppError(`Run is in "${run.status}" state, not awaiting approval`, 400);
      }

      // Find approval gate step
      const step = await prisma.workflowStepRun.findFirst({
        where: { workflowRunId: run.id, nodeType: 'APPROVAL_GATE', status: 'RUNNING' },
      });

      if (step) {
        await prisma.workflowStepRun.update({
          where: { id: step.id },
          data: {
            status: 'SUCCEEDED',
            output: {
              approved: true,
              approvedBy: req.user.name,
              comment,
              approvedAt: new Date().toISOString(),
            },
            finishedAt: new Date(),
          },
        });
      }

      // Resume execution
      await enqueueWorkflowRun(run.id, true);

      logger.info(`Run ${run.id} approved by user ${req.user.name}. Resuming execution...`);

      res.status(200).json({
        success: true,
        message: 'Approval granted. Workflow execution resumed.',
      });
    } catch (err) {
      next(err);
    }
  },

  async reject(req, res, next) {
    try {
      const { runId } = req.params;
      const { reason = 'Rejected by reviewer' } = req.body;

      const run = await prisma.workflowRun.findFirst({
        where: { id: runId, triggeredBy: req.user.id },
      });

      if (!run) {
        throw new AppError('Workflow run not found or access denied', 404);
      }

      if (run.status !== 'WAITING_FOR_APPROVAL') {
        throw new AppError(`Run is in "${run.status}" state, not awaiting approval`, 400);
      }

      const step = await prisma.workflowStepRun.findFirst({
        where: { workflowRunId: run.id, nodeType: 'APPROVAL_GATE', status: 'RUNNING' },
      });

      if (step) {
        await prisma.workflowStepRun.update({
          where: { id: step.id },
          data: {
            status: 'FAILED',
            errorSummary: `Approval rejected: ${reason}`,
            output: { approved: false, rejectedBy: req.user.name, reason },
            finishedAt: new Date(),
          },
        });
      }

      await prisma.workflowRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          errorSummary: `Workflow rejected at approval gate: ${reason}`,
          finishedAt: new Date(),
        },
      });

      res.status(200).json({
        success: true,
        message: 'Workflow run rejected and terminated.',
      });
    } catch (err) {
      next(err);
    }
  },
};
