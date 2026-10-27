import { prisma } from '../../config/prisma.js';

export const analyticsController = {
  async getDashboard(req, res, next) {
    try {
      const userId = req.user.id;

      // 1. Workflow metrics
      const [totalWorkflows, activeWorkflows] = await Promise.all([
        prisma.workflow.count({ where: { ownerId: userId } }),
        prisma.workflow.count({ where: { ownerId: userId, status: 'ACTIVE' } }),
      ]);

      // 2. Execution metrics
      const [totalRuns, successfulRuns, failedRuns, waitingRuns] = await Promise.all([
        prisma.workflowRun.count({ where: { triggeredBy: userId } }),
        prisma.workflowRun.count({ where: { triggeredBy: userId, status: 'SUCCEEDED' } }),
        prisma.workflowRun.count({ where: { triggeredBy: userId, status: 'FAILED' } }),
        prisma.workflowRun.count({ where: { triggeredBy: userId, status: 'WAITING_FOR_APPROVAL' } }),
      ]);

      const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;

      // 3. Average duration of completed runs
      const completedSteps = await prisma.workflowStepRun.findMany({
        where: {
          workflowRun: { triggeredBy: userId },
          durationMs: { not: null },
        },
        select: { durationMs: true },
        take: 100,
      });

      const avgDurationMs = completedSteps.length > 0
        ? Math.round(completedSteps.reduce((acc, s) => acc + (s.durationMs || 0), 0) / completedSteps.length)
        : 0;

      // 4. AI usage metrics
      const usageRecords = await prisma.usageRecord.findMany({
        where: { ownerId: userId },
        select: { inputTokens: true, outputTokens: true, estimatedCost: true },
      });

      const totalTokens = usageRecords.reduce((acc, u) => acc + u.inputTokens + u.outputTokens, 0);
      const totalEstimatedCost = usageRecords.reduce((acc, u) => acc + u.estimatedCost, 0);

      // 5. Recent executions
      const recentRuns = await prisma.workflowRun.findMany({
        where: { triggeredBy: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          workflow: { select: { id: true, name: true } },
        },
      });

      // 6. Recent errors
      const recentErrors = await prisma.workflowRun.findMany({
        where: { triggeredBy: userId, status: 'FAILED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          workflowId: true,
          errorSummary: true,
          finishedAt: true,
          workflow: { select: { name: true } },
        },
      });

      // 7. Upcoming scheduled runs
      const scheduledTriggers = await prisma.scheduledTrigger.findMany({
        where: { ownerId: userId, enabled: true },
        include: { workflow: { select: { name: true } } },
        take: 5,
      });

      res.status(200).json({
        success: true,
        data: {
          workflows: {
            total: totalWorkflows,
            active: activeWorkflows,
          },
          runs: {
            total: totalRuns,
            successful: successfulRuns,
            failed: failedRuns,
            waitingForApproval: waitingRuns,
            successRate,
            avgDurationMs,
          },
          ai: {
            totalTokens,
            estimatedCost: Number(totalEstimatedCost.toFixed(4)),
            recordsCount: usageRecords.length,
          },
          recentRuns,
          recentErrors,
          scheduledTriggers,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};
