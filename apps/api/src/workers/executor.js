import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { aiClient } from '../services/aiClient.js';
import { validateSsrfUrl } from '../services/ssrf.js';
import { interpolateTemplate, evaluateCondition, transformJson, getByPath } from '@flowpilot/shared';

/**
 * Executes a single node within the workflow context.
 */
async function executeNode(node, context, runRecord) {
  const { type, config = {} } = node;

  switch (type) {
    case 'MANUAL_TRIGGER': {
      return {
        ...(runRecord.input || {}),
        _triggeredAt: new Date().toISOString(),
      };
    }

    case 'TEXT_INPUT': {
      if (config.sourceField) {
        const extracted = getByPath(context, config.sourceField);
        if (extracted !== undefined) {
          return { text: String(extracted) };
        }
      }
      return { text: config.text || '' };
    }

    case 'TEXT_TEMPLATE': {
      const template = config.template || '';
      const interpolated = interpolateTemplate(template, context);
      return { renderedText: interpolated };
    }

    case 'CONDITION': {
      const { field, operator, value } = config;
      const conditionResult = evaluateCondition(field, operator, value, context);
      return {
        conditionResult,
        evaluatedField: field,
        actualValue: getByPath(context, field),
      };
    }

    case 'AI_SUMMARIZE': {
      const rawText = getByPath(context, config.inputField) || context.ticket_text || context.text || '';
      const result = await aiClient.summarize(String(rawText), config.maxLength, config.tone);

      // Record token usage
      await prisma.usageRecord.create({
        data: {
          ownerId: runRecord.triggeredBy,
          workflowRunId: runRecord.id,
          provider: 'fastapi-ai',
          model: result.model || 'ai-summarize-v1',
          inputTokens: result.tokensUsed || 50,
          outputTokens: 25,
          estimatedCost: 0.0001,
        },
      }).catch(err => logger.error('Failed to log usage record', err));

      return result;
    }

    case 'AI_CLASSIFY': {
      const rawText = getByPath(context, config.inputField) || context.ticket_text || context.text || '';
      const categories = config.categories || ['general', 'support'];
      const result = await aiClient.classify(String(rawText), categories, config.instruction);

      await prisma.usageRecord.create({
        data: {
          ownerId: runRecord.triggeredBy,
          workflowRunId: runRecord.id,
          provider: 'fastapi-ai',
          model: result.model || 'ai-classify-v1',
          inputTokens: result.tokensUsed || 40,
          outputTokens: 15,
          estimatedCost: 0.0001,
        },
      }).catch(err => logger.error('Failed to log usage record', err));

      return result;
    }

    case 'AI_EXTRACT': {
      const rawText = getByPath(context, config.inputField) || context.ticket_text || context.text || '';
      const schemaFields = config.schemaFields || [];
      const result = await aiClient.extract(String(rawText), schemaFields);

      await prisma.usageRecord.create({
        data: {
          ownerId: runRecord.triggeredBy,
          workflowRunId: runRecord.id,
          provider: 'fastapi-ai',
          model: result.model || 'ai-extract-v1',
          inputTokens: result.tokensUsed || 60,
          outputTokens: 30,
          estimatedCost: 0.00015,
        },
      }).catch(err => logger.error('Failed to log usage record', err));

      return result;
    }

    case 'JSON_TRANSFORM': {
      return transformJson(config.mappings || {}, config.pickKeys || null, context);
    }

    case 'DELAY': {
      const delayMs = Math.min((config.seconds || 1) * 1000, 10000); // capped at 10s for responsive runs
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return { delayedSeconds: config.seconds || 1 };
    }

    case 'APPROVAL_GATE': {
      // Handled in main execution loop
      return { prompt: config.prompt, status: 'WAITING_FOR_APPROVAL' };
    }

    case 'REPORT_OUTPUT': {
      const fields = config.fields || {};
      const reportData = { title: config.title || 'Summary Report' };
      for (const [key, templateStr] of Object.entries(fields)) {
        reportData[key] = interpolateTemplate(templateStr, context);
      }
      return reportData;
    }

    case 'WEBHOOK_ACTION': {
      const { url, method = 'POST', headers = {}, bodyTemplate = '{}' } = config;

      // Validate SSRF security
      await validateSsrfUrl(url);

      const resolvedBody = interpolateTemplate(bodyTemplate, context);
      let parsedBody;
      try {
        parsedBody = JSON.parse(resolvedBody);
      } catch {
        parsedBody = { raw: resolvedBody };
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', ...headers },
          body: method !== 'GET' ? JSON.stringify(parsedBody) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        const text = await res.text();
        return {
          statusCode: res.status,
          statusText: res.statusText,
          responseBodySnippet: text.slice(0, 500),
        };
      } catch (err) {
        clearTimeout(timeout);
        throw new Error(`Webhook dispatch failed: ${err.message}`);
      }
    }

    default:
      throw new Error(`Unrecognized node type: ${type}`);
  }
}

/**
 * Main Workflow Execution Engine.
 * Supports resumption after APPROVAL_GATE approval.
 */
export async function executeWorkflowRun(runId, isResumption = false) {
  logger.info(`Starting execution for workflow run: ${runId} (resumption=${isResumption})`);

  const run = await prisma.workflowRun.findUnique({
    where: { id: runId },
    include: {
      workflow: true,
      workflowVersion: true,
      stepRuns: true,
    },
  });

  if (!run) {
    logger.error(`Workflow run not found: ${runId}`);
    return;
  }

  // Check if cancelled
  if (run.status === 'CANCELLED') {
    logger.info(`Workflow run was cancelled prior to execution: ${runId}`);
    return;
  }

  // Update status to RUNNING
  await prisma.workflowRun.update({
    where: { id: runId },
    data: {
      status: 'RUNNING',
      startedAt: run.startedAt || new Date(),
    },
  });

  // Use graph definition from snapshot version or current workflow
  const definition = run.workflowVersion?.definition || run.workflow.definition;
  const nodes = definition.nodes || [];
  const edges = definition.edges || [];

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const context = { ...(run.input || {}) };

  // Track completed step outputs in context
  for (const step of run.stepRuns) {
    if (step.status === 'SUCCEEDED' && step.output) {
      context[step.nodeId] = step.output;
    }
  }

  // Build dependency map: nodeId -> array of prerequisite nodeIds
  const incomingEdges = new Map();
  for (const node of nodes) {
    incomingEdges.set(node.id, []);
  }
  for (const edge of edges) {
    if (incomingEdges.has(edge.target)) {
      incomingEdges.get(edge.target).push(edge);
    }
  }

  // Track node status in memory
  const stepStatusMap = new Map();
  for (const step of run.stepRuns) {
    stepStatusMap.set(step.nodeId, step.status);
  }

  let finalReportOutput = null;

  try {
    let progress = true;

    while (progress) {
      progress = false;

      // Check for user cancellation between steps
      const currentRunCheck = await prisma.workflowRun.findUnique({
        where: { id: runId },
        select: { status: true },
      });
      if (currentRunCheck?.status === 'CANCELLED') {
        logger.info(`Execution cancelled by user for run: ${runId}`);
        return;
      }

      for (const node of nodes) {
        const nodeId = node.id;
        const currentStatus = stepStatusMap.get(nodeId);

        // Skip if already evaluated
        if (currentStatus === 'SUCCEEDED' || currentStatus === 'SKIPPED') {
          continue;
        }

        // Check if all incoming dependencies are met
        const inEdges = incomingEdges.get(nodeId) || [];
        let canExecute = true;
        let shouldSkip = false;

        for (const edge of inEdges) {
          const sourceStatus = stepStatusMap.get(edge.source);

          if (!sourceStatus || sourceStatus === 'QUEUED' || sourceStatus === 'RUNNING') {
            canExecute = false;
            break;
          }

          if (sourceStatus === 'SKIPPED') {
            shouldSkip = true;
            break;
          }

          // If source is a CONDITION node, check branch match
          const sourceNode = nodeMap.get(edge.source);
          if (sourceNode?.type === 'CONDITION') {
            const conditionOutput = context[edge.source];
            const condResult = conditionOutput?.conditionResult;
            const expectedHandle = edge.sourceHandle || 'true';

            const branchMatched = (condResult === true && expectedHandle === 'true') ||
                                  (condResult === false && expectedHandle === 'false');

            if (!branchMatched) {
              shouldSkip = true;
              break;
            }
          }
        }

        if (!canExecute) {
          continue;
        }

        if (shouldSkip) {
          stepStatusMap.set(nodeId, 'SKIPPED');
          await prisma.workflowStepRun.upsert({
            where: { id: `${runId}_${nodeId}` },
            update: { status: 'SKIPPED' },
            create: {
              id: `${runId}_${nodeId}`,
              workflowRunId: runId,
              nodeId,
              nodeType: node.type,
              status: 'SKIPPED',
            },
          });
          progress = true;
          continue;
        }

        // Node is ready to execute!
        progress = true;

        // If node is APPROVAL_GATE and not approved yet
        if (node.type === 'APPROVAL_GATE') {
          const existingStep = await prisma.workflowStepRun.findUnique({
            where: { id: `${runId}_${nodeId}` },
          });

          if (existingStep?.status === 'SUCCEEDED' && existingStep.output?.approved) {
            // Already approved via /api/v1/approvals!
            stepStatusMap.set(nodeId, 'SUCCEEDED');
            context[nodeId] = existingStep.output;
            continue;
          }

          // Pause execution at APPROVAL_GATE
          await prisma.workflowStepRun.upsert({
            where: { id: `${runId}_${nodeId}` },
            update: { status: 'RUNNING', startedAt: new Date() },
            create: {
              id: `${runId}_${nodeId}`,
              workflowRunId: runId,
              nodeId,
              nodeType: node.type,
              status: 'RUNNING',
              startedAt: new Date(),
            },
          });

          await prisma.workflowRun.update({
            where: { id: runId },
            data: { status: 'WAITING_FOR_APPROVAL' },
          });

          logger.info(`Workflow run ${runId} paused at Approval Gate node: ${nodeId}`);
          return; // Stop execution loop; will resume when approved
        }

        // Standard Node Execution
        const startTime = Date.now();
        await prisma.workflowStepRun.upsert({
          where: { id: `${runId}_${nodeId}` },
          update: { status: 'RUNNING', startedAt: new Date(startTime) },
          create: {
            id: `${runId}_${nodeId}`,
            workflowRunId: runId,
            nodeId,
            nodeType: node.type,
            status: 'RUNNING',
            startedAt: new Date(startTime),
          },
        });

        let stepOutput;
        try {
          stepOutput = await executeNode(node, context, run);
          const durationMs = Date.now() - startTime;

          context[nodeId] = stepOutput;
          stepStatusMap.set(nodeId, 'SUCCEEDED');

          if (node.type === 'REPORT_OUTPUT') {
            finalReportOutput = stepOutput;
          }

          await prisma.workflowStepRun.update({
            where: { id: `${runId}_${nodeId}` },
            data: {
              status: 'SUCCEEDED',
              output: stepOutput,
              durationMs,
              finishedAt: new Date(),
            },
          });
        } catch (stepErr) {
          const durationMs = Date.now() - startTime;
          logger.error(`Node execution error on [${nodeId} (${node.type})]:`, stepErr);

          await prisma.workflowStepRun.update({
            where: { id: `${runId}_${nodeId}` },
            data: {
              status: 'FAILED',
              errorSummary: stepErr.message,
              durationMs,
              finishedAt: new Date(),
            },
          });

          await prisma.workflowRun.update({
            where: { id: runId },
            data: {
              status: 'FAILED',
              errorSummary: `Step [${node.label || nodeId}] failed: ${stepErr.message}`,
              finishedAt: new Date(),
            },
          });

          return;
        }
      }
    }

    // Execution complete! Mark SUCCEEDED
    await prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: 'SUCCEEDED',
        output: finalReportOutput || context,
        finishedAt: new Date(),
      },
    });

    logger.info(`Workflow run ${runId} completed successfully.`);
  } catch (err) {
    logger.error(`Unhandled error during workflow execution for run ${runId}:`, err);
    await prisma.workflowRun.update({
      where: { id: runId },
      data: {
        status: 'FAILED',
        errorSummary: err.message,
        finishedAt: new Date(),
      },
    }).catch(() => {});
  }
}
