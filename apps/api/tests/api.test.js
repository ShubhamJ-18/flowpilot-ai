import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

test('FlowPilot API Integration Test Suite', async (t) => {
  let userCookie = null;
  let userToken = null;
  let userId = null;
  let createdWorkflowId = null;
  let createdRunId = null;

  const testEmail = `test_${Date.now()}@flowpilot.ai`;
  const testPassword = 'Password123!';

  await t.test('1. Health check returns 200 and service name', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.service, 'FlowPilot AI API Gateway');
  });

  await t.test('2. Register new user returns 201 and sets session cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Integration Tester',
        email: testEmail,
        password: testPassword,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, testEmail);

    userId = res.body.data.user.id;
    userToken = res.body.data.token;

    const cookieHeader = res.headers['set-cookie'];
    assert.ok(cookieHeader, 'Expected set-cookie header');
    userCookie = cookieHeader[0];
  });

  await t.test('3. Duplicate registration is rejected with 409', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate',
        email: testEmail,
        password: testPassword,
      });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
  });

  await t.test('4. Login with correct password returns token and cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, testEmail);
  });

  await t.test('5. Login with invalid password returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'wrong_password',
      });

    assert.equal(res.status, 401);
  });

  await t.test('6. GET /api/v1/auth/me returns authenticated user details', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', userCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.user.id, userId);
  });

  await t.test('7. Unauthorized request without session returns 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    assert.equal(res.status, 401);
  });

  await t.test('8. Validate graph endpoint detects cycles and returns errors', async () => {
    const cyclicGraph = {
      nodes: [
        { id: 'trigger_1', type: 'MANUAL_TRIGGER', config: {} },
        { id: 'n1', type: 'TEXT_INPUT', config: { text: '1' } },
        { id: 'n2', type: 'TEXT_INPUT', config: { text: '2' } },
      ],
      edges: [
        { source: 'trigger_1', target: 'n1' },
        { source: 'n1', target: 'n2' },
        { source: 'n2', target: 'n1' },
      ],
    };

    const res = await request(app)
      .post('/api/v1/workflows/validate')
      .set('Cookie', userCookie)
      .send({ definition: cyclicGraph });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.isValid, false);
    assert.ok(res.body.data.errors.length > 0);
  });

  await t.test('9. Create valid workflow persists in PostgreSQL with version 1', async () => {
    const validGraph = {
      nodes: [
        { id: 'trigger_1', type: 'MANUAL_TRIGGER', config: { inputSchema: { text: 'string' } } },
        { id: 'template_1', type: 'TEXT_TEMPLATE', config: { template: 'Processed ticket: {{text}}' } },
        { id: 'report_1', type: 'REPORT_OUTPUT', config: { title: 'Ticket Report', fields: { output: '{{template_1.renderedText}}' } } },
      ],
      edges: [
        { source: 'trigger_1', target: 'template_1' },
        { source: 'template_1', target: 'report_1' },
      ],
    };

    const res = await request(app)
      .post('/api/v1/workflows')
      .set('Cookie', userCookie)
      .send({
        name: 'Customer Support Pipeline',
        description: 'Test workflow for automated ticket processing',
        status: 'ACTIVE',
        definition: validGraph,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.workflow.name, 'Customer Support Pipeline');
    assert.equal(res.body.data.workflow.version, 1);

    createdWorkflowId = res.body.data.workflow.id;
  });

  await t.test('10. Trigger workflow run dispatches execution and produces step runs', async () => {
    const res = await request(app)
      .post('/api/v1/runs')
      .set('Cookie', userCookie)
      .send({
        workflowId: createdWorkflowId,
        input: { text: 'Server outage in EU region' },
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(['QUEUED', 'RUNNING', 'SUCCEEDED'].includes(res.body.data.run.status));

    createdRunId = res.body.data.run.id;

    // Wait 500ms for in-process execution to complete
    await new Promise((r) => setTimeout(r, 600));

    const checkRes = await request(app)
      .get(`/api/v1/runs/${createdRunId}`)
      .set('Cookie', userCookie);

    assert.equal(checkRes.status, 200);
    assert.equal(checkRes.body.data.run.status, 'SUCCEEDED');
    assert.equal(checkRes.body.data.run.stepRuns.length, 3);
  });

  await t.test('11. Security Test: Cross-user access (IDOR) is blocked with 404/403', async () => {
    // Register another user
    const otherRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Attacker Bob',
        email: `bob_${Date.now()}@flowpilot.ai`,
        password: 'Password123!',
      });

    const bobCookie = otherRes.headers['set-cookie'][0];

    // Bob tries to access first user's workflow
    const forbiddenWorkflow = await request(app)
      .get(`/api/v1/workflows/${createdWorkflowId}`)
      .set('Cookie', bobCookie);

    assert.equal(forbiddenWorkflow.status, 404);

    // Bob tries to access first user's run details
    const forbiddenRun = await request(app)
      .get(`/api/v1/runs/${createdRunId}`)
      .set('Cookie', bobCookie);

    assert.equal(forbiddenRun.status, 404);
  });

  await t.test('12. Dashboard analytics returns real database records and zero errors', async () => {
    const res = await request(app)
      .get('/api/v1/analytics/dashboard')
      .set('Cookie', userCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.workflows.total >= 1, true);
    assert.equal(res.body.data.runs.total >= 1, true);
    assert.equal(typeof res.body.data.runs.successRate, 'number');
  });

  await t.test('13. Logout invalidates session and clears cookie', async () => {
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', userCookie);

    assert.equal(logoutRes.status, 200);

    // After logout, accessing /me should fail
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', userCookie);

    assert.equal(meRes.status, 401);
  });
});
