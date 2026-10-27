import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FlowPilot AI database...');

  // Clean existing development seed data if needed
  await prisma.usageRecord.deleteMany();
  await prisma.workflowStepRun.deleteMany();
  await prisma.workflowRun.deleteMany();
  await prisma.workflowVersion.deleteMany();
  await prisma.scheduledTrigger.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.session.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Admin and Standard User
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@flowpilot.ai',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      name: 'Alex Johnson',
      email: 'alex@flowpilot.ai',
      passwordHash,
      role: 'USER',
    },
  });

  console.log(`👤 Created users: ${adminUser.email} (ADMIN), ${demoUser.email} (USER)`);

  // 2. Create Starter Workflow
  const sampleDefinition = {
    nodes: [
      {
        id: 'trigger_1',
        type: 'MANUAL_TRIGGER',
        label: 'Support Ticket Ingestion',
        position: { x: 100, y: 180 },
        config: {
          inputSchema: { ticket_text: 'string', customer_email: 'string' },
          description: 'Receives customer ticket payloads',
        },
      },
      {
        id: 'classify_1',
        type: 'AI_CLASSIFY',
        label: 'Classify Urgency',
        position: { x: 380, y: 100 },
        config: {
          inputField: 'ticket_text',
          categories: ['urgent', 'standard', 'low', 'spam'],
          instruction: 'Classify ticket severity based on business impact',
        },
      },
      {
        id: 'summarize_1',
        type: 'AI_SUMMARIZE',
        label: 'Summarize Issue',
        position: { x: 380, y: 280 },
        config: {
          inputField: 'ticket_text',
          maxLength: 'concise',
          tone: 'professional',
        },
      },
      {
        id: 'condition_1',
        type: 'CONDITION',
        label: 'Is Ticket Urgent?',
        position: { x: 680, y: 100 },
        config: {
          field: 'classify_1.category',
          operator: 'equals',
          value: 'urgent',
        },
      },
      {
        id: 'approval_1',
        type: 'APPROVAL_GATE',
        label: 'Manager Approval Gate',
        position: { x: 960, y: 80 },
        config: {
          prompt: 'Urgent ticket requires manager authorization before escalation report.',
          timeoutHours: 24,
        },
      },
      {
        id: 'report_1',
        type: 'REPORT_OUTPUT',
        label: 'Executive Digest',
        position: { x: 960, y: 280 },
        config: {
          title: 'Daily Ticket Triage Summary',
          fields: {
            summary: '{{summarize_1.summary}}',
            urgency: '{{classify_1.category}}',
          },
        },
      },
    ],
    edges: [
      { id: 'e1', source: 'trigger_1', target: 'classify_1' },
      { id: 'e2', source: 'trigger_1', target: 'summarize_1' },
      { id: 'e3', source: 'classify_1', target: 'condition_1' },
      { id: 'e4', source: 'condition_1', target: 'approval_1', sourceHandle: 'true' },
      { id: 'e5', source: 'condition_1', target: 'report_1', sourceHandle: 'false' },
      { id: 'e6', source: 'summarize_1', target: 'report_1' },
    ],
  };

  const starterWorkflow = await prisma.workflow.create({
    data: {
      ownerId: demoUser.id,
      name: 'Customer Support Ticket Triage & Digest',
      description: 'Automatically analyzes customer support tickets, classifies urgency, condenses the core issues, and compiles an executive report.',
      status: 'ACTIVE',
      version: 1,
      definition: sampleDefinition,
    },
  });

  const versionRecord = await prisma.workflowVersion.create({
    data: {
      workflowId: starterWorkflow.id,
      version: 1,
      definition: sampleDefinition,
      createdBy: demoUser.id,
    },
  });

  console.log(`📋 Created starter workflow: ${starterWorkflow.name} (v1)`);

  // 3. Create Sample Completed Run
  const sampleRun = await prisma.workflowRun.create({
    data: {
      workflowId: starterWorkflow.id,
      workflowVersionId: versionRecord.id,
      triggeredBy: demoUser.id,
      status: 'SUCCEEDED',
      input: {
        ticket_text: 'Urgent: Payment gateway returns 502 error during checkout for enterprise accounts.',
        customer_email: 'enterprise-client@bigcorp.com',
      },
      output: {
        title: 'Daily Ticket Triage Summary',
        summary: 'Payment gateway returns 502 error during checkout for enterprise accounts.',
        urgency: 'urgent',
      },
      startedAt: new Date(Date.now() - 120000),
      finishedAt: new Date(Date.now() - 95000),
    },
  });

  // 4. Create Step Runs
  const steps = [
    {
      nodeId: 'trigger_1',
      nodeType: 'MANUAL_TRIGGER',
      status: 'SUCCEEDED',
      durationMs: 45,
      output: { ticket_text: 'Urgent: Payment gateway returns 502 error during checkout.', customer_email: 'enterprise-client@bigcorp.com' },
    },
    {
      nodeId: 'classify_1',
      nodeType: 'AI_CLASSIFY',
      status: 'SUCCEEDED',
      durationMs: 220,
      output: { category: 'urgent', confidence: 0.94, reasoning: 'Found keyword urgent and payment critical path.' },
    },
    {
      nodeId: 'summarize_1',
      nodeType: 'AI_SUMMARIZE',
      status: 'SUCCEEDED',
      durationMs: 310,
      output: { summary: 'Payment gateway returns 502 error during checkout for enterprise accounts.', wordCount: 10 },
    },
    {
      nodeId: 'condition_1',
      nodeType: 'CONDITION',
      status: 'SUCCEEDED',
      durationMs: 12,
      output: { conditionResult: true, evaluatedField: 'urgent' },
    },
    {
      nodeId: 'approval_1',
      nodeType: 'APPROVAL_GATE',
      status: 'SUCCEEDED',
      durationMs: 1800,
      output: { approved: true, approvedBy: 'Alex Johnson', comment: 'Confirmed escalation' },
    },
    {
      nodeId: 'report_1',
      nodeType: 'REPORT_OUTPUT',
      status: 'SUCCEEDED',
      durationMs: 40,
      output: { title: 'Daily Ticket Triage Summary', summary: 'Payment gateway returns 502 error.', urgency: 'urgent' },
    },
  ];

  for (const step of steps) {
    await prisma.workflowStepRun.create({
      data: {
        workflowRunId: sampleRun.id,
        nodeId: step.nodeId,
        nodeType: step.nodeType,
        status: step.status,
        input: {},
        output: step.output,
        durationMs: step.durationMs,
        startedAt: new Date(Date.now() - 110000),
        finishedAt: new Date(Date.now() - 110000 + step.durationMs),
      },
    });
  }

  // 5. Create Usage Records for Analytics
  await prisma.usageRecord.create({
    data: {
      ownerId: demoUser.id,
      workflowRunId: sampleRun.id,
      provider: 'mock',
      model: 'mock-model-v1',
      inputTokens: 85,
      outputTokens: 32,
      estimatedCost: 0.0001,
    },
  });

  console.log('✅ Seed complete: Users, workflow, versions, execution run, and step logs initialized.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
