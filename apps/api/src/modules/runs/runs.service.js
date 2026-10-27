import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { enqueueWorkflowRun } from '../../workers/queue.js';
import { logger } from '../../utils/logger.js';

export const runsService = {
  async triggerRun(userId, { workflowId, input = {}, idempotencyKey }) {
    // 1. Verify workflow exists and belongs to user
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, ownerId: userId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!workflow) {
      throw new AppError('Workflow not found or access denied', 404);
    }

    // 2. Check Idempotency Key
    if (idempotencyKey) {
      const existing = await prisma.workflowRun.findUnique({
        where: { idempotencyKey },
        include: { stepRuns: true },
      });
      if (existing) {
        logger.info(`Idempotent request returning existing workflow run: ${existing.id}`);
        return existing;
      }
    }

    const latestVersion = workflow.versions[0];

    // 3. Create WorkflowRun record
    const run = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        workflowVersionId: latestVersion?.id,
        triggeredBy: userId,
        status: 'QUEUED',
        input,
        idempotencyKey: idempotencyKey || null,
      },
    });

    // 4. Enqueue execution
    await enqueueWorkflowRun(run.id);

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'WORKFLOW_RUN',
        entityType: 'WorkflowRun',
        entityId: run.id,
        safeMetadata: { workflowId: workflow.id },
      },
    }).catch(() => {});

    return run;
  },

  async listRuns(userId, { workflowId, status, page = 1, limit = 20 }) {
    const skip = (Math.max(1, page) - 1) * limit;

    const where = {
      triggeredBy: userId,
      ...(workflowId && { workflowId }),
      ...(status && { status }),
    };

    const [runs, total] = await Promise.all([
      prisma.workflowRun.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          workflow: {
            select: { id: true, name: true, version: true },
          },
          _count: {
            select: { stepRuns: true },
          },
        },
      }),
      prisma.workflowRun.count({ where }),
    ]);

    return {
      runs,
      pagination: {
        page: Math.max(1, page),
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getRunDetails(userId, runId) {
    const run = await prisma.workflowRun.findFirst({
      where: { id: runId, triggeredBy: userId },
      include: {
        workflow: {
          select: { id: true, name: true, description: true, definition: true, version: true },
        },
        workflowVersion: true,
        stepRuns: {
          orderBy: { createdAt: 'asc' },
        },
        usageRecords: true,
      },
    });

    if (!run) {
      throw new AppError('Execution run not found or access denied', 404);
    }

    return run;
  },

  async cancelRun(userId, runId) {
    const run = await prisma.workflowRun.findFirst({
      where: { id: runId, triggeredBy: userId },
    });

    if (!run) {
      throw new AppError('Workflow run not found or access denied', 404);
    }

    if (['SUCCEEDED', 'FAILED', 'CANCELLED'].includes(run.status)) {
      throw new AppError(`Cannot cancel run with terminal status "${run.status}"`, 400);
    }

    const updated = await prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: 'CANCELLED',
        finishedAt: new Date(),
        errorSummary: 'Execution cancelled by user',
      },
    });

    return updated;
  },

  async retryRun(userId, runId) {
    const previousRun = await prisma.workflowRun.findFirst({
      where: { id: runId, triggeredBy: userId },
    });

    if (!previousRun) {
      throw new AppError('Workflow run not found or access denied', 404);
    }

    const newRun = await prisma.workflowRun.create({
      data: {
        workflowId: previousRun.workflowId,
        workflowVersionId: previousRun.workflowVersionId,
        triggeredBy: userId,
        status: 'QUEUED',
        input: previousRun.input || {},
      },
    });

    await enqueueWorkflowRun(newRun.id);
    return newRun;
  },
};
