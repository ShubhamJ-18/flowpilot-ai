import cron from 'node-cron';
import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { enqueueWorkflowRun } from './queue.js';

const activeTasks = new Map();

/**
 * Dispatches a scheduled workflow execution.
 */
async function triggerScheduledRun(triggerId) {
  try {
    const trigger = await prisma.scheduledTrigger.findUnique({
      where: { id: triggerId },
      include: { workflow: true },
    });

    if (!trigger || !trigger.enabled || trigger.workflow.status !== 'ACTIVE') {
      return;
    }

    const idempotencyKey = `cron_${trigger.id}_${Date.now()}`;

    const run = await prisma.workflowRun.create({
      data: {
        workflowId: trigger.workflowId,
        triggeredBy: trigger.ownerId,
        status: 'QUEUED',
        idempotencyKey,
        input: { scheduled: true, triggerId: trigger.id, triggeredAt: new Date().toISOString() },
      },
    });

    await enqueueWorkflowRun(run.id);
    logger.info(`Scheduled trigger fired: ${trigger.id} -> Run ${run.id}`);
  } catch (err) {
    logger.error(`Error executing scheduled trigger ${triggerId}:`, err);
  }
}

/**
 * Initializes and syncs all active database cron schedules on startup.
 */
export async function initializeScheduler() {
  logger.info('Initializing Workflow Scheduler...');

  // Clear existing cron tasks
  for (const [id, task] of activeTasks.entries()) {
    task.stop();
    activeTasks.delete(id);
  }

  try {
    const triggers = await prisma.scheduledTrigger.findMany({
      where: { enabled: true },
    });

    for (const trigger of triggers) {
      if (!cron.validate(trigger.cronExpression)) {
        logger.warn(`Invalid cron expression for trigger ${trigger.id}: ${trigger.cronExpression}`);
        continue;
      }

      const task = cron.schedule(
        trigger.cronExpression,
        () => triggerScheduledRun(trigger.id),
        { timezone: trigger.timezone || 'UTC' }
      );

      activeTasks.set(trigger.id, task);
    }

    logger.info(`Scheduler loaded ${activeTasks.size} active cron triggers.`);
  } catch (err) {
    logger.error('Failed to load scheduled triggers from database:', err);
  }
}

export function registerSchedule(trigger) {
  if (activeTasks.has(trigger.id)) {
    activeTasks.get(trigger.id).stop();
    activeTasks.delete(trigger.id);
  }

  if (trigger.enabled && cron.validate(trigger.cronExpression)) {
    const task = cron.schedule(
      trigger.cronExpression,
      () => triggerScheduledRun(trigger.id),
      { timezone: trigger.timezone || 'UTC' }
    );
    activeTasks.set(trigger.id, task);
  }
}

export function unregisterSchedule(triggerId) {
  if (activeTasks.has(triggerId)) {
    activeTasks.get(triggerId).stop();
    activeTasks.delete(triggerId);
  }
}
