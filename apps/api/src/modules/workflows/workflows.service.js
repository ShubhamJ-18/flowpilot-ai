import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { validateWorkflowGraph } from '@flowpilot/shared';
import { aiClient } from '../../services/aiClient.js';
import { logger } from '../../utils/logger.js';

export const workflowsService = {
  async listWorkflows(userId, { search, status, page = 1, limit = 20 }) {
    const skip = (Math.max(1, page) - 1) * limit;

    const where = {
      ownerId: userId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [workflows, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { runs: true, versions: true },
          },
        },
      }),
      prisma.workflow.count({ where }),
    ]);

    return {
      workflows,
      pagination: {
        page: Math.max(1, page),
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async createWorkflow(userId, { name, description, definition, status = 'DRAFT' }) {
    // 1. Validate graph definition
    const validation = validateWorkflowGraph(definition);
    if (!validation.isValid) {
      throw new AppError('Workflow validation failed', 400, validation.errors);
    }

    // 2. Create workflow in database
    const workflow = await prisma.workflow.create({
      data: {
        ownerId: userId,
        name: name.trim(),
        description: description ? description.trim() : null,
        status,
        version: 1,
        definition,
      },
    });

    // 3. Create initial immutable version snapshot
    await prisma.workflowVersion.create({
      data: {
        workflowId: workflow.id,
        version: 1,
        definition,
        createdBy: userId,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'WORKFLOW_CREATE',
        entityType: 'Workflow',
        entityId: workflow.id,
        safeMetadata: { name: workflow.name },
      },
    }).catch(() => {});

    return workflow;
  },

  async getWorkflow(userId, workflowId) {
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, ownerId: userId },
      include: {
        _count: {
          select: { runs: true, versions: true },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 5,
        },
      },
    });

    if (!workflow) {
      throw new AppError('Workflow not found or access denied', 404);
    }

    return workflow;
  },

  async updateWorkflow(userId, workflowId, { name, description, definition, status }) {
    const existing = await prisma.workflow.findFirst({
      where: { id: workflowId, ownerId: userId },
    });

    if (!existing) {
      throw new AppError('Workflow not found or access denied', 404);
    }

    // Validate if definition is being modified
    if (definition) {
      const validation = validateWorkflowGraph(definition);
      if (!validation.isValid) {
        throw new AppError('Workflow validation failed', 400, validation.errors);
      }
    }

    const nextVersion = definition ? existing.version + 1 : existing.version;

    const updated = await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(status && { status }),
        ...(definition && { definition, version: nextVersion }),
      },
    });

    // Snapshot immutable version if definition changed
    if (definition) {
      await prisma.workflowVersion.create({
        data: {
          workflowId: updated.id,
          version: nextVersion,
          definition,
          createdBy: userId,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'WORKFLOW_UPDATE',
        entityType: 'Workflow',
        entityId: updated.id,
        safeMetadata: { version: nextVersion },
      },
    }).catch(() => {});

    return updated;
  },

  async deleteWorkflow(userId, workflowId) {
    const existing = await prisma.workflow.findFirst({
      where: { id: workflowId, ownerId: userId },
    });

    if (!existing) {
      throw new AppError('Workflow not found or access denied', 404);
    }

    await prisma.workflow.delete({
      where: { id: workflowId },
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'WORKFLOW_DELETE',
        entityType: 'Workflow',
        entityId: workflowId,
      },
    }).catch(() => {});

    return { success: true, message: 'Workflow deleted successfully.' };
  },

  async validateGraph(definition) {
    return validateWorkflowGraph(definition);
  },

  async generateFromNaturalLanguage(userId, prompt) {
    logger.info(`Generating workflow proposal for user ${userId} with prompt: "${prompt.slice(0, 80)}..."`);
    const aiResponse = await aiClient.generateWorkflow(prompt);

    const proposal = aiResponse.proposal;

    // Validate AI proposal against shared node registry
    const validation = validateWorkflowGraph({
      nodes: proposal.nodes,
      edges: proposal.edges,
    });

    // Record usage
    await prisma.usageRecord.create({
      data: {
        ownerId: userId,
        provider: aiResponse.provider || 'fastapi-ai',
        model: aiResponse.model || 'mock-model',
        inputTokens: aiResponse.tokensUsed || 180,
        outputTokens: 80,
        estimatedCost: aiResponse.estimatedCost || 0.0002,
      },
    }).catch(() => {});

    return {
      proposal,
      validation,
      metadata: {
        tokensUsed: aiResponse.tokensUsed,
        model: aiResponse.model,
        provider: aiResponse.provider,
        estimatedCost: aiResponse.estimatedCost,
      },
    };
  },

  async listVersions(userId, workflowId) {
    const workflow = await prisma.workflow.findFirst({
      where: { id: workflowId, ownerId: userId },
    });

    if (!workflow) {
      throw new AppError('Workflow not found or access denied', 404);
    }

    return prisma.workflowVersion.findMany({
      where: { workflowId },
      orderBy: { version: 'desc' },
    });
  },
};
