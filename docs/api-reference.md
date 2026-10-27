# FlowPilot AI — REST API Reference

All backend API endpoints are versioned under `/api/v1`.

## Authentication (`/api/v1/auth`)
- `POST /register`: Create a new user account `{ name, email, password }`
- `POST /login`: Authenticate and issue HttpOnly session cookie `{ email, password }`
- `POST /logout`: Invalidate session and clear cookie
- `GET /me`: Retrieve authenticated user profile and permissions
- `POST /forgot-password`: Request password reset token `{ email }`
- `POST /reset-password`: Reset password with token `{ token, newPassword }`

## Workflows (`/api/v1/workflows`)
- `GET /`: List workflows owned by current user (supports pagination, search, status filter)
- `POST /`: Create a new workflow `{ name, description, definition }`
- `GET /:id`: Retrieve workflow definition, metadata, and version count
- `PUT /:id`: Update workflow definition and increment version
- `DELETE /:id`: Delete workflow and associated draft assets
- `POST /validate`: Validate a graph definition without persisting it
- `POST /generate`: Prompt-assisted workflow generation via AI service `{ prompt }`
- `GET /:id/versions`: List historical versions of a workflow

## Executions (`/api/v1/runs`)
- `POST /`: Trigger a workflow execution `{ workflowId, input, idempotencyKey }`
- `GET /`: List runs with status, duration, and workflow metadata
- `GET /:id`: Retrieve detailed execution state, step progress, and logs
- `POST /:id/cancel`: Terminate an active or queued workflow run
- `POST /:id/retry`: Rerun a failed execution with original input parameters

## Approvals (`/api/v1/approvals`)
- `GET /pending`: List runs awaiting approval for the current user
- `POST /:runId/approve`: Approve pending execution `{ comment }`
- `POST /:runId/reject`: Reject pending execution `{ reason }`

## Integrations (`/api/v1/integrations`)
- `GET /`: List configured integrations (credentials redacted)
- `POST /`: Add a new integration `{ provider, displayName, credentials }`
- `DELETE /:id`: Remove an integration

## Analytics & Dashboard (`/api/v1/analytics`)
- `GET /dashboard`: Aggregate metrics (total workflows, active runs, success rate, AI token consumption)

## Health (`/api/v1/health`)
- `GET /`: Liveness and readiness check
