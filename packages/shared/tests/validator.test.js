import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWorkflowGraph, interpolateTemplate, evaluateCondition, transformJson } from '../src/index.js';

test('valid graph validation passes and returns topological execution order', () => {
  const validGraph = {
    nodes: [
      { id: 'trigger_1', type: 'MANUAL_TRIGGER', config: { inputSchema: { text: 'string' } } },
      { id: 'classify_1', type: 'AI_CLASSIFY', config: { categories: ['urgent', 'low'] } },
      { id: 'report_1', type: 'REPORT_OUTPUT', config: { title: 'Final Report' } },
    ],
    edges: [
      { source: 'trigger_1', target: 'classify_1' },
      { source: 'classify_1', target: 'report_1' },
    ],
  };

  const result = validateWorkflowGraph(validGraph);
  assert.equal(result.isValid, true);
  assert.equal(result.errors.length, 0);
  assert.deepEqual(result.executionOrder, ['trigger_1', 'classify_1', 'report_1']);
});

test('graph with cycle is detected and rejected', () => {
  const cyclicGraph = {
    nodes: [
      { id: 'trigger_1', type: 'MANUAL_TRIGGER', config: {} },
      { id: 'node_a', type: 'TEXT_INPUT', config: { text: 'a' } },
      { id: 'node_b', type: 'TEXT_INPUT', config: { text: 'b' } },
    ],
    edges: [
      { source: 'trigger_1', target: 'node_a' },
      { source: 'node_a', target: 'node_b' },
      { source: 'node_b', target: 'node_a' }, // Cycle!
    ],
  };

  const result = validateWorkflowGraph(cyclicGraph);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some(e => e.message.includes('Cycle detected')));
});

test('graph with missing trigger is rejected', () => {
  const noTrigger = {
    nodes: [
      { id: 'node_a', type: 'TEXT_INPUT', config: { text: 'a' } },
    ],
    edges: [],
  };

  const result = validateWorkflowGraph(noTrigger);
  assert.equal(result.isValid, false);
  assert.ok(result.errors.some(e => e.message.includes('trigger node')));
});

test('template interpolates nested variables safely', () => {
  const context = {
    classify_1: { category: 'urgent' },
    user: { profile: { name: 'Alice' } },
  };
  const template = 'Priority: {{classify_1.category}} for {{user.profile.name}}';
  const output = interpolateTemplate(template, context);
  assert.equal(output, 'Priority: urgent for Alice');
});

test('condition evaluator works deterministically', () => {
  const context = {
    classify: { urgency: 'urgent', score: 85 },
  };

  assert.equal(evaluateCondition('classify.urgency', 'equals', 'urgent', context), true);
  assert.equal(evaluateCondition('classify.urgency', 'equals', 'low', context), false);
  assert.equal(evaluateCondition('classify.score', 'greater_than', 50, context), true);
  assert.equal(evaluateCondition('classify.urgency', 'in', ['urgent', 'critical'], context), true);
});

test('json transformer safely extracts and renames fields without eval', () => {
  const context = {
    step1: { data: 'sample' },
    step2: { total: 100 },
  };

  const transformed = transformJson(
    { mappedData: 'step1.data', totalCount: 'step2.total' },
    ['mappedData', 'totalCount'],
    context
  );

  assert.deepEqual(transformed, { mappedData: 'sample', totalCount: 100 });
});
