import { Queue, Worker } from 'bullmq';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { executeWorkflowRun } from './executor.js';

let workflowQueue = null;
let workflowWorker = null;
let isUsingRedis = false;

// Attempt to initialize BullMQ if REDIS_URL is provided
if (env.REDIS_URL && env.REDIS_URL.startsWith('redis://')) {
  try {
    const connection = {
      url: env.REDIS_URL,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };

    workflowQueue = new Queue('workflow-runs', { connection });

    workflowWorker = new Worker(
      'workflow-runs',
      async (job) => {
        const { runId, isResumption } = job.data;
        await executeWorkflowRun(runId, isResumption);
      },
      { connection, concurrency: 5 }
    );

    workflowWorker.on('completed', (job) => {
      logger.info(`BullMQ job completed for run: ${job.data.runId}`);
    });

    workflowWorker.on('failed', (job, err) => {
      logger.error(`BullMQ job failed for run: ${job?.data?.runId}`, err);
    });

    isUsingRedis = true;
    logger.info('BullMQ workflow queue initialized with Redis.');
  } catch (err) {
    logger.warn('Failed to initialize BullMQ with Redis, falling back to in-process queue adapter.', { error: err.message });
    isUsingRedis = false;
  }
}

/**
 * In-process asynchronous queue adapter.
 * Uses setImmediate to schedule jobs outside the main request cycle.
 */
class InProcessQueue {
  async add(name, data) {
    logger.info(`[InProcessQueue] Enqueueing workflow run: ${data.runId}`);
    setImmediate(async () => {
      try {
        await executeWorkflowRun(data.runId, data.isResumption);
      } catch (err) {
        logger.error(`[InProcessQueue] Execution error for run: ${data.runId}`, err);
      }
    });
    return { id: `local_${Date.now()}` };
  }
}

const localQueue = new InProcessQueue();

export async function enqueueWorkflowRun(runId, isResumption = false) {
  if (isUsingRedis && workflowQueue) {
    try {
      await workflowQueue.add('execute', { runId, isResumption }, {
        attempts: 2,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      });
      return;
    } catch (err) {
      logger.warn('BullMQ enqueue failed, executing via in-process adapter fallback', { error: err.message });
    }
  }

  // Fallback to in-process execution queue
  await localQueue.add('execute', { runId, isResumption });
}
