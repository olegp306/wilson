# Stage 2 notes (Wilson platform skeleton)

## What changed

- **Domain / Prisma**: Stronger tenant, employee, workflow, and audit models (status enums, manager hierarchy, audit correlation index). Seed creates a demo tenant, admin and member employees with a manager link, and agent config rows.
- **`@wilson/db`**: Nest-free helpers for `writeAuditLog`, `createWorkflowRun`, and `finishWorkflowRun` used by admin-api and orchestrator.
- **Admin API**: Real CRUD-style routes for tenants, employees (including tenant-scoped paths), manager assignment, manager-relation listing, agent config list/toggle, and integration connection stubs. **Lightweight auth**: when `ADMIN_API_KEY` is set, clients must send matching `x-admin-key`; health checks stay public. Audit entries for tenant/employee/manager/agent/integration actions.
- **Orchestrator**: `OrchestratorApplicationService` (workflow run + audit around each dispatch; uses `AGENT_HTTP_ROUTES` and `capabilityForCommand` from contracts for metadata), resilient persistence when Postgres is unavailable (dispatch still works). `DispatchService` publishes to the in-memory bus then delegates to the application service.
- **Event contracts**: Command names aligned with product language (`GET_MY_TASKS`, `GET_MY_CALENDAR`, `GET_LATEST_MAIL_SUMMARY`, `GENERATE_DRAFT_REPLY`, `CREATE_TASK_FROM_MAIL`) with capability mapping in `capabilities.ts`.
- **Agents**: Task agent exposes `POST /tasks/from-mail` stub matching the contract.
- **Telegram bot**: Commands `/tasks`, `/calendar`, `/mail-summary`, `/draft-reply`; optional audit log `TELEGRAM_COMMAND_RECEIVED` when `DATABASE_URL` is set. Dev simulation supports `/draft-reply`.
- **Integration SDK**: Ports for mail, calendar, task, and Telegram transport plus no-op mocks for future real adapters.
- **Tests**: Contract tests updated; `tests/contracts/capability-routing.spec.ts`; e2e-style demo flow test (capability mapping, formatter, mocked `fetch`). Root `pnpm run test` runs `prisma generate` + Vitest with path aliases (no Turbo).

## How the orchestrator works now

1. HTTP `POST /api/dispatch` validates the payload (`validateOrchestratorPayload`).
2. `DispatchService` publishes `orchestrator.command.*` on the in-memory bus.
3. `OrchestratorApplicationService.execute` resolves **capability** and **route** from `@wilson/event-contracts`, attempts to create a `WorkflowRun` and audit `ORCHESTRATOR_COMMAND_DISPATCHED`, then calls `OrchestrationRuntime` (HTTP to agents).
4. On completion, workflow is finished (`SUCCEEDED` / `FAILED`) and audit `WORKFLOW_SUCCEEDED` / `WORKFLOW_FAILED` is written when DB access works.
5. Result is published as `orchestrator.result.*` and returned to the client.

## How agent registration works

There is no runtime plugin registry across processes. **Registration is static** in `@wilson/event-contracts`: `AGENT_HTTP_ROUTES` and `COMMAND_TO_CAPABILITY` (via `capabilityForCommand`). The orchestrator imports these directly; tests cover routing in `tests/contracts/capability-routing.spec.ts`.

## How audit logging works

- **Admin API**: `AuditService` calls `writeAuditLog` for create tenant, create employee, manager assignment, agent toggle, integration create.
- **Orchestrator**: Workflow lifecycle + dispatch/success/failure actions on `AuditLog` with `correlationId` when the database is reachable.
- **Telegram**: `telegram-audit.ts` writes `TELEGRAM_COMMAND_RECEIVED` when `DATABASE_URL` is set; otherwise it no-ops with a debug log.

## Tenant-aware execution

Orchestrator commands carry `tenantId` and optional `employeeId` in `CorrelationContext`; HTTP runtime forwards `x-tenant-id` and `x-employee-id` to agents per `WILSON_HTTP_HEADERS`.

## What is still mocked

- Agents return deterministic or stub data; no Gmail, Google Calendar, or Jira API calls.
- Integration connections store opaque secrets; no OAuth or provider sync.
- Orchestrator message bus remains in-process; NATS is not wired to dispatch.
- Admin auth is a shared secret header, not SSO.

## Recommended Stage 3

- Wire NATS (or another broker) behind `MessageBus` for cross-service events.
- Real OAuth and encrypted credential storage for integration connections.
- Production Telegram webhook mode and verified updates.
- Admin UI (read-only or CRUD) against the existing admin API.
- Per-tenant agent health checks and rate limits on `/api/dispatch`.
