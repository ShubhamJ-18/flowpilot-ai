import { z } from 'zod';

export const NodeCategory = {
  TRIGGER: 'TRIGGER',
  INPUT: 'INPUT',
  LOGIC: 'LOGIC',
  AI: 'AI',
  TRANSFORM: 'TRANSFORM',
  UTILITY: 'UTILITY',
  HUMAN: 'HUMAN',
  INTEGRATION: 'INTEGRATION',
  OUTPUT: 'OUTPUT',
};

export const NodeType = {
  MANUAL_TRIGGER: 'MANUAL_TRIGGER',
  TEXT_INPUT: 'TEXT_INPUT',
  TEXT_TEMPLATE: 'TEXT_TEMPLATE',
  CONDITION: 'CONDITION',
  AI_SUMMARIZE: 'AI_SUMMARIZE',
  AI_CLASSIFY: 'AI_CLASSIFY',
  AI_EXTRACT: 'AI_EXTRACT',
  JSON_TRANSFORM: 'JSON_TRANSFORM',
  DELAY: 'DELAY',
  APPROVAL_GATE: 'APPROVAL_GATE',
  REPORT_OUTPUT: 'REPORT_OUTPUT',
  WEBHOOK_ACTION: 'WEBHOOK_ACTION',
};

// Node Registry Specifications with Zod Schemas
export const NODE_REGISTRY = {
  [NodeType.MANUAL_TRIGGER]: {
    type: NodeType.MANUAL_TRIGGER,
    displayName: 'Manual Trigger',
    category: NodeCategory.TRIGGER,
    icon: 'PlayCircle',
    description: 'Starts a workflow manually with customizable JSON or key-value input.',
    isTrigger: true,
    maxInputs: 0,
    maxOutputs: 10,
    timeoutMs: 5000,
    configSchema: z.object({
      inputSchema: z.record(z.string(), z.string()).default({}),
      description: z.string().optional().default('Triggered manually by user or API request'),
    }),
    defaultConfig: {
      inputSchema: { ticket_text: 'string', customer_email: 'string' },
      description: 'Triggered manually',
    },
  },

  [NodeType.TEXT_INPUT]: {
    type: NodeType.TEXT_INPUT,
    displayName: 'Text Input',
    category: NodeCategory.INPUT,
    icon: 'FileText',
    description: 'Provides constant text or extracts a specified key from incoming workflow data.',
    isTrigger: false,
    maxInputs: 1,
    maxOutputs: 10,
    timeoutMs: 5000,
    configSchema: z.object({
      text: z.string().default(''),
      sourceField: z.string().optional().default(''),
    }),
    defaultConfig: {
      text: '',
      sourceField: 'ticket_text',
    },
  },

  [NodeType.TEXT_TEMPLATE]: {
    type: NodeType.TEXT_TEMPLATE,
    displayName: 'Text Template',
    category: NodeCategory.TRANSFORM,
    icon: 'AlignLeft',
    description: 'Safely interpolates variables using {{node_id.field}} syntax. No arbitrary code execution.',
    isTrigger: false,
    maxInputs: 10,
    maxOutputs: 10,
    timeoutMs: 5000,
    configSchema: z.object({
      template: z.string().min(1, 'Template text cannot be empty'),
    }),
    defaultConfig: {
      template: 'Summary: {{summarize_1.summary}}\nUrgency: {{classify_1.category}}',
    },
  },

  [NodeType.CONDITION]: {
    type: NodeType.CONDITION,
    displayName: 'Condition Branch',
    category: NodeCategory.LOGIC,
    icon: 'GitFork',
    description: 'Evaluates declarative logic rules to route execution down True or False branches.',
    isTrigger: false,
    maxInputs: 10,
    maxOutputs: 2, // 'true' and 'false' ports
    timeoutMs: 5000,
    configSchema: z.object({
      field: z.string().min(1, 'Field reference required (e.g. classify_1.category)'),
      operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'is_empty']),
      value: z.any().optional(),
    }),
    defaultConfig: {
      field: 'classify_1.category',
      operator: 'equals',
      value: 'urgent',
    },
  },

  [NodeType.AI_SUMMARIZE]: {
    type: NodeType.AI_SUMMARIZE,
    displayName: 'AI Summarize',
    category: NodeCategory.AI,
    icon: 'Sparkles',
    description: 'Condenses provided text using configured LLM with length and tone control.',
    isTrigger: false,
    maxInputs: 10,
    maxOutputs: 10,
    timeoutMs: 30000,
    configSchema: z.object({
      inputField: z.string().default('ticket_text'),
      maxLength: z.enum(['concise', 'medium', 'detailed']).default('concise'),
      tone: z.enum(['neutral', 'professional', 'bullet_points']).default('professional'),
    }),
    defaultConfig: {
      inputField: 'ticket_text',
      maxLength: 'concise',
      tone: 'professional',
    },
  },

  [NodeType.AI_CLASSIFY]: {
    type: NodeType.AI_CLASSIFY,
    displayName: 'AI Classify',
    category: NodeCategory.AI,
    icon: 'Tags',
    description: 'Classifies input text into strict, predefined category tags with confidence score.',
    isTrigger: false,
    maxInputs: 10,
    maxOutputs: 10,
    timeoutMs: 30000,
    configSchema: z.object({
      inputField: z.string().default('ticket_text'),
      categories: z.array(z.string().min(1)).min(2, 'At least 2 categories required'),
      instruction: z.string().optional().default('Classify ticket urgency and intent'),
    }),
    defaultConfig: {
      inputField: 'ticket_text',
      categories: ['urgent', 'standard', 'low', 'spam'],
      instruction: 'Classify ticket urgency and priority',
    },
  },

  [NodeType.AI_EXTRACT]: {
    type: NodeType.AI_EXTRACT,
    displayName: 'AI Extract',
    category: NodeCategory.AI,
    icon: 'ScanText',
    description: 'Extracts structured entity attributes matching a validated JSON schema specification.',
    isTrigger: false,
    maxInputs: 10,
    maxOutputs: 10,
    timeoutMs: 30000,
    configSchema: z.object({
      inputField: z.string().default('ticket_text'),
      schemaFields: z.array(
        z.object({
          name: z.string().min(1),
          type: z.enum(['string', 'number', 'boolean', 'list']),
          description: z.string().optional(),
        })
      ).min(1, 'At least one extraction field must be defined'),
    }),
    defaultConfig: {
      inputField: 'ticket_text',
      schemaFields: [
        { name: 'customer_name', type: 'string', description: 'Customer name' },
        { name: 'issue_topic', type: 'string', description: 'Core issue topic' },
        { name: 'sentiment', type: 'string', description: 'Negative, Neutral, or Positive' },
      ],
    },
  },

  [NodeType.JSON_TRANSFORM]: {
    type: NodeType.JSON_TRANSFORM,
    displayName: 'JSON Transform',
    category: NodeCategory.TRANSFORM,
    icon: 'FileCode',
    description: 'Deterministic mapping, pick, and rename transformations. No eval or dynamic JS.',
    isTrigger: false,
    maxInputs: 10,
    maxOutputs: 10,
    timeoutMs: 5000,
    configSchema: z.object({
      mappings: z.record(z.string(), z.string()).default({}),
      pickKeys: z.array(z.string()).optional(),
    }),
    defaultConfig: {
      mappings: {
        ticketSummary: 'summarize_1.summary',
        ticketCategory: 'classify_1.category',
      },
      pickKeys: ['ticketSummary', 'ticketCategory'],
    },
  },

  [NodeType.DELAY]: {
    type: NodeType.DELAY,
    displayName: 'Delay',
    category: NodeCategory.UTILITY,
    icon: 'Clock',
    description: 'Pauses workflow execution for a bounded number of seconds (up to 300s).',
    isTrigger: false,
    maxInputs: 10,
    maxOutputs: 10,
    timeoutMs: 310000,
    configSchema: z.object({
      seconds: z.number().int().min(1).max(300, 'Max delay is 300 seconds'),
    }),
    defaultConfig: {
      seconds: 5,
    },
  },

  [NodeType.APPROVAL_GATE]: {
    type: NodeType.APPROVAL_GATE,
    displayName: 'Approval Gate',
    category: NodeCategory.HUMAN,
    icon: 'ShieldCheck',
    description: 'Pauses execution until an authorized user explicitly reviews and approves continuation.',
    isTrigger: false,
    maxInputs: 10,
    maxOutputs: 10,
    timeoutMs: 86400000, // 24 hours max
    configSchema: z.object({
      prompt: z.string().min(1).default('Requires human approval before sending downstream actions'),
      timeoutHours: z.number().min(1).max(72).default(24),
    }),
    defaultConfig: {
      prompt: 'Please review classified ticket before triggering external report dispatch.',
      timeoutHours: 24,
    },
  },

  [NodeType.REPORT_OUTPUT]: {
    type: NodeType.REPORT_OUTPUT,
    displayName: 'Report Output',
    category: NodeCategory.OUTPUT,
    icon: 'CheckCircle2',
    description: 'Aggregates collected inputs and step outputs into a structured final report.',
    isTrigger: false,
    maxInputs: 10,
    maxOutputs: 0,
    timeoutMs: 5000,
    configSchema: z.object({
      title: z.string().default('Execution Summary Report'),
      fields: z.record(z.string(), z.string()).default({}),
    }),
    defaultConfig: {
      title: 'Ticket Analysis Report',
      fields: {
        summary: '{{summarize_1.summary}}',
        urgency: '{{classify_1.category}}',
      },
    },
  },

  [NodeType.WEBHOOK_ACTION]: {
    type: NodeType.WEBHOOK_ACTION,
    displayName: 'Webhook Action',
    category: NodeCategory.INTEGRATION,
    icon: 'Send',
    description: 'Dispatches an HTTP POST/PUT request to an approved, SSRF-validated external URL.',
    isTrigger: false,
    maxInputs: 10,
    maxOutputs: 10,
    timeoutMs: 15000,
    configSchema: z.object({
      url: z.string().url('Must be a valid URL'),
      method: z.enum(['POST', 'PUT', 'GET']).default('POST'),
      headers: z.record(z.string(), z.string()).default({ 'Content-Type': 'application/json' }),
      bodyTemplate: z.string().optional().default('{}'),
    }),
    defaultConfig: {
      url: 'https://httpbin.org/post',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      bodyTemplate: '{"summary": "{{summarize_1.summary}}", "urgency": "{{classify_1.category}}"}',
    },
  },
};
