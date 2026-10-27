# FlowPilot AI — System Architecture

## 1. System Overview

**FlowPilot AI** is an enterprise-grade AI-assisted workflow automation platform that allows users to describe business automation workflows in natural language, convert those prompts into validated graph structures, edit them visually, execute them reliably, and monitor their real-time execution states.

```
+-----------------------------------------------------------------------------------+
|                                  USER / CLIENT                                    |
|   (Next.js App Router, React 18, React Flow, Tailwind CSS, Lucide Icons)           |
+------------------------------------------+----------------------------------------+
                                           | HTTPS / REST / Session Cookies
                                           v
+-----------------------------------------------------------------------------------+
|                              EXPRESS.JS API GATEWAY                               |
|   - Authentication & Session Management (PostgreSQL store, HttpOnly Cookies)      |
|   - RBAC & Tenant/Resource Ownership Authorization                                |
|   - Graph Validation Engine (Cycle detection, Reachability, Schema constraints)    |
|   - Execution Orchestrator (BullMQ Queue / In-Process Fallback Adapter)            |
|   - Webhook Action Engine (SSRF-hardened HTTP client)                             |
+---------------------+-------------------------------+-----------------------------+
                      |                               |
       SQL via Prisma |                               | REST (Internal JSON)
                      v                               v
+-------------------------------+   +-----------------------------------------------+
|      POSTGRESQL DATABASE      |   |            PYTHON FASTAPI AI SERVICE          |
|  - Users & Sessions           |   |  - LLM Provider Abstraction (Mock/OpenAI)     |
|  - Workflows & Versions       |   |  - Natural Language Workflow Generator        |
|  - WorkflowRuns & StepRuns    |   |  - AI Processing (Summarize, Classify, Extract|
|  - AuditLogs & UsageRecords   |   |  - Pydantic Schema Validation & Repair        |
+-------------------------------+   +-----------------------------------------------+
```

## 2. Key Architecture Pillars

### 2.1 Deterministic & Sandboxed Node Execution
The AI service is **strictly constrained to graph generation and content transformation**. It is **never** permitted to generate or execute arbitrary shell commands, JavaScript `eval()`, Python scripts, or direct SQL. Every execution step maps to an approved, statically registered node handler in the Node Registry.

### 2.2 Immutable Workflow Versioning
When a workflow is updated, the active definition is saved. However, whenever an execution run (`WorkflowRun`) is triggered, the run snapshots an immutable `WorkflowVersion` record. If the user edits the workflow while a run is in progress or inspects an historical run, the historical run references the exact graph definition that executed.

### 2.3 Resilient Multi-Stage Execution Engine
The workflow execution engine executes nodes along a directed acyclic graph (DAG) topologically:
- Predecessors must complete with `SUCCEEDED` status before dependents execute.
- In conditional branching (`CONDITION` node), dependent edges specify branch handles (`true` or `false`). Inactive branches are skipped deterministically.
- Interactive gates (`APPROVAL_GATE`) pause the run in a `WAITING_FOR_APPROVAL` state, enabling users to inspect intermediate outputs before approving or rejecting resumption.
- Bounded retries with exponential backoff handle transient network errors.

### 2.4 Hybrid Queue Architecture
In production or environments with Redis, execution jobs are scheduled through `BullMQ`. In lightweight local development without a running Redis server, FlowPilot AI provides an in-process queue adapter that adheres to the exact same queue/worker semantics, guaranteeing that developer workflows execute out-of-the-box.
