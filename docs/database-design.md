# FlowPilot AI — Database Design & Schema Specification

## 1. Relational Entity Overview

The FlowPilot AI relational database is implemented using PostgreSQL with Prisma ORM.

### Models:
1. **User**: User accounts with email uniqueness, Argon2id/bcrypt hashed passwords, and system roles (`USER`, `ADMIN`).
2. **Session**: Stateful server-side session tracking with cryptographically secure session IDs, expiration timestamps, IP address, and user agent metadata.
3. **Workflow**: Top-level workflow metadata (name, description, status `DRAFT` | `ACTIVE` | `ARCHIVED`, active JSON definition, and version counter).
4. **WorkflowVersion**: Immutable historical snapshot of workflow definitions, created upon publication or execution.
5. **WorkflowRun**: Execution instance with tracking of status (`QUEUED`, `RUNNING`, `WAITING_FOR_APPROVAL`, `SUCCEEDED`, `FAILED`, `CANCELLED`), trigger source, idempotency keys, start/finish timestamps, input parameters, and output results.
6. **WorkflowStepRun**: Step-level node execution records tracking attempt count, input payload, output payload, error messages, and execution duration in milliseconds.
7. **Integration**: Encrypted third-party configurations (e.g. Webhook endpoints, API keys) encrypted at rest using AES-256-GCM.
8. **ScheduledTrigger**: Cron schedules configured for automated workflow dispatch with timezone handling and next run timestamps.
9. **UsageRecord**: AI token consumption and estimated execution costs per workflow run and user.
10. **AuditLog**: Sensitive user actions (auth changes, workflow updates, manual executions, credential rotations) logged with actor metadata.

## 2. Integrity and Constraints
- Cascade deletes are restricted to user-owned draft resources, while execution runs and versions maintain referential integrity to prevent orphaned operational history.
- UUID v4 identifiers are utilized across all primary keys.
- Compound indexes are placed on `(ownerId, status)`, `(workflowId, createdAt)`, and `(workflowRunId, status)`.
