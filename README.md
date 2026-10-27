# FlowPilot AI — Intelligent Workflow Automation Platform

[![Node.js](https://img.shields.io/badge/Node.js-v22-green.svg)](https://nodejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-v0.111-teal.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-v14.2-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v18-blue.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-v5.22-darkblue.svg)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

FlowPilot AI is an enterprise-grade AI-assisted workflow automation platform that enables users to describe business processes in natural language, converts those descriptions into structured directed acyclic graphs (DAGs), visually inspects and edits them in a node-based visual editor, executes them through a sandboxed backend execution engine, and records full execution telemetry and step logs.

---

## 1. System Architecture

```
+-----------------------------------------------------------------------------------+
|                                  USER BROWSER                                     |
|  - Next.js 14 App Router + React 18 + Tailwind CSS                                 |
|  - React Flow visual workflow canvas (@xyflow/react)                              |
|  - Dynamic node status indicators (idle, running, succeeded, failed)             |
|  - Natural language AI generation modal with review & apply                       |
+------------------------------------------+----------------------------------------+
                                           | HTTP / REST (HttpOnly Session Cookies)
                                           v
+-----------------------------------------------------------------------------------+
|                           EXPRESS.JS BACKEND GATEWAY                              |
|  - REST API under /api/v1 (Auth, Workflows, Runs, Approvals, Integrations)        |
|  - Session management in PostgreSQL with SHA-256 token hashing                    |
|  - Resource ownership checks (IDOR prevention) & Role-Based Access Control        |
|  - Graph Validation Engine (Cycle detection, Reachability, Schema validation)     |
|  - Execution Queue Orchestrator (BullMQ with Redis / In-Process fallback)         |
|  - SSRF-protected Webhook dispatcher (IP range & DNS validation)                  |
+---------------------+-------------------------------+-----------------------------+
                      |                               |
       SQL via Prisma |                               | REST (Internal JSON)
                      v                               v
+-------------------------------+   +-----------------------------------------------+
|      POSTGRESQL DATABASE      |   |            PYTHON FASTAPI AI SERVICE          |
|  - Users & Sessions           |   |  - Provider Abstraction (Mock / OpenAI)       |
|  - Workflows & Versions (JSON)|   |  - Natural Language Workflow Generator        |
|  - WorkflowRuns & StepRuns    |   |  - Summarize, Classify, Extract endpoints     |
|  - Integrations (AES-256-GCM) |   |  - Pydantic schema validation & auto-repair   |
|  - AuditLogs & UsageRecords   |   |  - Token consumption & cost tracking          |
+-------------------------------+   +-----------------------------------------------+
```

---

## 2. Key Features

- **Natural Language to Validated Graph**: Users describe automations in plain text (e.g., *"Analyze support tickets, classify urgency, summarize core issues, route urgent tickets to manager approval, and generate a report"*). FlowPilot generates an approved node graph.
- **Strict Node Registry (No Arbitrary Code Execution)**: The AI is restricted to 12 approved node types with typed configuration schemas. Arbitrary code execution (`eval()`, shell scripts, raw SQL) is impossible by design.
- **Visual DAG Canvas (React Flow)**: Visual node-based workflow builder with custom handles for conditional branching (`true` and `false` ports), node status rings during live execution, pan, zoom, and minimap.
- **Topological Execution Engine**: Executes DAG nodes according to mathematical dependency ordering, handles branching logic, propagates outputs across steps, and persists duration and step telemetry.
- **Human-in-the-Loop Approvals (`APPROVAL_GATE`)**: Pauses workflows in a `WAITING_FOR_APPROVAL` state, allowing authorized users to inspect intermediate outputs before approving or rejecting resumption.
- **Immutable Workflow Versioning**: Every execution is snapshotted to a persistent `WorkflowVersion`, ensuring auditability and reproducible reruns even if draft definitions are modified.
- **SSRF Protection & Secret Encryption**: Webhooks validate resolved destination IPs against private/cloud metadata ranges. Credentials stored at rest are encrypted with AES-256-GCM.
- **Telemetry & Observability**: Real database aggregations for total runs, success rates, average duration, recent errors, and AI token costs.

---

## 3. Technology Stack

| Component | Technology |
|---|---|
| **Web Frontend** | Next.js 14 (App Router), React 18, Tailwind CSS, `@xyflow/react`, Lucide Icons |
| **Backend API Gateway** | Node.js, Express.js (ES Modules), Zod, Helmet, Cookie-Session, bcryptjs |
| **Database & ORM** | PostgreSQL 18, Prisma ORM 5.22, SQL migrations |
| **Execution Queue** | BullMQ with Redis / In-Process Asynchronous Queue Adapter fallback |
| **AI Microservice** | Python 3.14 / 3.11, FastAPI, Pydantic v2, HTTPX, Pytest |
| **Security** | Argon2/bcrypt, AES-256-GCM, HttpOnly cookies, SSRF DNS firewall |

---

## 4. Repository Structure

```
flowpilot-ai/
  apps/
    web/                  # Next.js 14 App Router frontend
      app/                # App Router pages (/, /login, /register, /dashboard, /workflows, /runs, /integrations, /settings, /admin)
      components/         # Layout, React Flow CustomNode, NodePalette, Drawers, Modals
      lib/                # API client, Auth Context
    api/                  # Express.js REST API
      src/
        config/           # Environment validation (Zod), Prisma client
        middleware/       # Auth, RBAC, Security, Validator, ErrorHandler
        modules/          # Auth, Workflows, Runs, Approvals, Integrations, Analytics
        services/         # AI client, Crypto (AES-256-GCM), SSRF validator
        workers/          # Execution engine (executor.js), Queue adapter, Cron scheduler
      tests/              # Supertest integration and security tests
    ai/                   # Python FastAPI AI microservice
      app/
        api/              # Routes (/generate-workflow, /summarize, /classify, /extract)
        core/             # Settings, logging
        providers/        # BaseProvider, MockAIProvider, OpenAIProvider
        schemas/          # Pydantic v2 workflow & processing models
        services/         # Workflow generator & repair logic
      tests/              # Pytest test suite
  packages/
    shared/               # Node registry definitions, Zod schemas, graph validator, evaluator
  prisma/
    schema.prisma         # PostgreSQL data models
    seed.js               # Development seed script
  docs/                   # Architecture, API reference, database design, security specs
  docker-compose.yml      # Container orchestration
  .env.example            # Environment template
  package.json            # Monorepo orchestration scripts
```

---

## 5. Approved Node Registry

FlowPilot strictly executes 12 approved node types:

| Node Type | Category | Description |
|---|---|---|
| `MANUAL_TRIGGER` | Trigger | Entry point accepting user-supplied JSON or form parameters. |
| `TEXT_INPUT` | Input | Static text or extracts key from workflow context. |
| `TEXT_TEMPLATE` | Transform | Safe variable interpolation (`{{nodeId.field}}`, no `eval()`). |
| `CONDITION` | Logic | Declarative rules (`equals`, `contains`, `greater_than`, `in`) with `true`/`false` ports. |
| `AI_SUMMARIZE` | AI | Condenses input text via FastAPI AI service with length and tone control. |
| `AI_CLASSIFY` | AI | Classifies input text into strict, predefined category tags with confidence score. |
| `AI_EXTRACT` | AI | Extracts structured JSON entities according to a validated schema. |
| `JSON_TRANSFORM` | Transform | Deterministic object mapping, picking, and key renaming without user code. |
| `DELAY` | Utility | Pauses execution for a bounded duration (up to 300s). |
| `APPROVAL_GATE` | Human | Pauses run in `WAITING_FOR_APPROVAL` until an authorized user reviews and approves. |
| `REPORT_OUTPUT` | Output | Gathers upstream values into a final compiled summary report. |
| `WEBHOOK_ACTION` | Integration | Dispatches HTTP request to SSRF-validated external destination. |

---

## 6. Quick Start & Setup Instructions

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: PostgreSQL 14+ running locally (or via Docker)
- **Python**: 3.10+ (for `apps/ai`)

### 1. Clone & Configure Environment
```bash
git clone <repo-url>
cd flowpilot-ai

# Copy environment template
cp .env.example .env
```
Ensure `DATABASE_URL` in `.env` matches your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/flowpilot_dev?schema=public"
TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/flowpilot_test?schema=public"
```

### 2. Install Monorepo Dependencies
```bash
npm install
```

### 3. Setup Python AI Service Virtual Environment
```bash
python -m venv apps/ai/.venv

# Windows
.\apps\ai\.venv\Scripts\pip install -r apps/ai/requirements.txt

# Linux / macOS
./apps/ai/.venv/bin/pip install -r apps/ai/requirements.txt
```

### 4. Run Database Migrations & Seed
```bash
# Push schema and apply migrations
npm run prisma:migrate

# Seed development users and demo workflows
npm run prisma:seed
```

**Default Seed Credentials:**
- **Standard User**: `alex@flowpilot.ai` / `Password123!`
- **Administrator**: `admin@flowpilot.ai` / `Password123!`

---

## 7. Running the Application

### Option A: Run Services Concurrently
```bash
# Start backend API (Port 4001)
npm run dev:api

# In a second terminal, start Next.js web application (Port 3000)
npm run dev:web

# In a third terminal, start Python FastAPI AI service (Port 8001)
# Windows:
$env:PYTHONPATH="apps/ai"; .\apps\ai\.venv\Scripts\python -m uvicorn app.main:app --port 8001 --reload
# Linux/macOS:
PYTHONPATH=apps/ai ./apps/ai/.venv/bin/python -m uvicorn app.main:app --port 8001 --reload
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 8. Automated Testing

All tests run against real database records and verifiable modules:

```bash
# 1. Run Shared Graph Validator & Evaluator Unit Tests (6 tests)
node --test packages/shared/tests/validator.test.js

# 2. Run API Integration, Authentication & Security IDOR Tests (14 tests)
node --test apps/api/tests/api.test.js

# 3. Run Python AI FastAPI Unit Tests (4 tests)
# Windows:
$env:PYTHONPATH="apps/ai"; .\apps\ai\.venv\Scripts\pytest apps/ai/tests
# Linux/macOS:
PYTHONPATH=apps/ai ./apps/ai/.venv/bin/pytest apps/ai/tests
```

**Total Automated Test Coverage: 24 passed, 0 failed.**

---

## 9. Security & Hardening Controls

1. **Authentication & Session Tokens**: Passwords hashed with `bcryptjs` (cost factor 10). Session tokens stored as SHA-256 hashes in PostgreSQL; cookies use `HttpOnly`, `SameSite=Lax`, and `Secure` (production).
2. **Strict Resource Authorization (IDOR Prevention)**: All queries verify `ownerId = req.user.id`. Modifying a workflow ID or execution ID in a request returns 404/403.
3. **SSRF Hardened Webhooks**: `validateSsrfUrl` resolves DNS hostnames before dispatching requests, blocking access to `127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, and `169.254.169.254` (cloud metadata endpoints).
4. **Secret Storage**: Integration credentials encrypted at rest with AES-256-GCM. Stored secrets are never serialized in API responses or logs.

---

## 10. Sample Workflow JSON

```json
{
  "name": "Customer Support Triage",
  "nodes": [
    {
      "id": "trigger_1",
      "type": "MANUAL_TRIGGER",
      "config": { "inputSchema": { "ticket_text": "string" } },
      "position": { "x": 100, "y": 180 }
    },
    {
      "id": "classify_1",
      "type": "AI_CLASSIFY",
      "config": {
        "inputField": "ticket_text",
        "categories": ["urgent", "normal", "low"]
      },
      "position": { "x": 380, "y": 100 }
    },
    {
      "id": "summarize_1",
      "type": "AI_SUMMARIZE",
      "config": { "inputField": "ticket_text", "maxLength": "concise" },
      "position": { "x": 380, "y": 280 }
    },
    {
      "id": "condition_1",
      "type": "CONDITION",
      "config": { "field": "classify_1.category", "operator": "equals", "value": "urgent" },
      "position": { "x": 680, "y": 100 }
    },
    {
      "id": "approval_1",
      "type": "APPROVAL_GATE",
      "config": { "prompt": "Authorize ticket escalation" },
      "position": { "x": 960, "y": 80 }
    },
    {
      "id": "report_1",
      "type": "REPORT_OUTPUT",
      "config": {
        "title": "Daily Ticket Triage Summary",
        "fields": { "summary": "{{summarize_1.summary}}", "urgency": "{{classify_1.category}}" }
      },
      "position": { "x": 960, "y": 280 }
    }
  ],
  "edges": [
    { "id": "e1", "source": "trigger_1", "target": "classify_1" },
    { "id": "e2", "source": "trigger_1", "target": "summarize_1" },
    { "id": "e3", "source": "classify_1", "target": "condition_1" },
    { "id": "e4", "source": "condition_1", "target": "approval_1", "sourceHandle": "true" },
    { "id": "e5", "source": "condition_1", "target": "report_1", "sourceHandle": "false" },
    { "id": "e6", "source": "summarize_1", "target": "report_1" }
  ]
}
```

---

## 11. Known Limitations & Next Steps

- **Redis Clustering**: The current setup uses a single Redis instance or in-process queue adapter; horizontal worker scale-out across multi-node clusters can be enhanced with Redis Sentinel.
- **WebSocket Live Streaming**: Active step runs currently use real-time polling on the canvas; adding WebSockets or SSE will provide instant push notifications for long-running workflows.
- **Third-Party OAuth Apps**: Currently supports direct webhook credentials; OAuth2 authorization code grant flows for Slack/Google can be added.
