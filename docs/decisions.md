# Architecture decisions (Wilson)

Short ADR-style notes for stage 1.

## ADR-001: Monorepo with pnpm and Turborepo

**Context:** Multiple services share command and event shapes; iteration speed matters.

**Decision:** Use a single repository with pnpm workspaces and Turborepo for builds.

**Consequences:** Shared packages stay type-safe and version-aligned. CI must scale with repo size; boundaries are enforced by package imports and review, not by separate repos.

## ADR-002: NestJS for HTTP services

**Context:** Admin API, orchestrator, and mock agents need structured HTTP APIs, validation, and documentation.

**Decision:** Use NestJS for these Node services.

**Consequences:** Consistent module layout and Swagger support; slightly heavier runtime than minimal Express-only servers. The Telegram bot stays a lightweight Node app without Nest.

## ADR-003: Prisma for PostgreSQL

**Context:** Tenant-scoped relational data with migrations and type-safe access.

**Decision:** Prisma schema at `prisma/schema.prisma`, migrations in `prisma/migrations`, client generated at install/build.

**Consequences:** Excellent DX and migrations; schema changes require migrate discipline. Raw SQL is still available via Prisma when needed.

## ADR-004: Swappable orchestration runtime

**Context:** Future orchestration may use OpenClaw, LangGraph, or another runtime; vendor lock-in must be avoided.

**Decision:** Define `OrchestrationRuntime` with `dispatch(command) -> OrchestratorDispatchResponse`. The first implementation performs HTTP calls to agents using environment-based URLs.

**Consequences:** Adding a broker-backed or graph-based runtime is a new implementation plus wiring, not a rewrite of Telegram or admin clients.

## ADR-005: NATS in Docker (not on critical path)

**Context:** Message broker choice should be consistent and Docker-friendly.

**Decision:** Standardize on **NATS** in Compose for local development; orchestrator HTTP remains the integration path for mock agents in stage 1.

**Consequences:** Operators learn one broker; implementing a `MessageBus` backed by NATS is straightforward when event fan-out must leave the process.

## ADR-006: Zod-validated agent HTTP contracts

**Context:** Orchestrator and agents must agree on request/response shapes without importing each other’s Nest modules.

**Decision:** Define routes, header names, Zod schemas, and parsers in `@wilson/event-contracts` (`agent-contracts.ts`). Agents call `.parse()` on mock data before responding; the orchestrator validates agent JSON with `parseAgentResponseBody`. Command payloads are validated with `validateOrchestratorPayload` before dispatch.

**Consequences:** Contract changes are explicit (schema diff + version bump). Runtime validation adds a small CPU cost; invalid agents fail fast with `AGENT_CONTRACT_VIOLATION`.

## ADR-007: Stage 2 platform skeleton (orchestrator application layer + shared DB helpers)

**Context:** Stage 1 proved HTTP routing and contracts; internal operations need audit trails, workflow records, and clearer layering without locking to one workflow engine.

**Decision:** Introduce `@wilson/db` with `writeAuditLog`, `createWorkflowRun`, and `finishWorkflowRun`; add `OrchestratorApplicationService` that wraps `OrchestrationRuntime` with workflow + audit writes and reads routing from `@wilson/event-contracts` (`AGENT_HTTP_ROUTES`, `capabilityForCommand`) directly—no extra Nest wrapper type. Persist best-effort: if PostgreSQL is unavailable, dispatch still succeeds.

**Consequences:** Operators should run Postgres for full observability; local agent-only tests remain possible. Replacing workflow storage with an external engine later means swapping the helper calls inside the application service, not Telegram or admin clients.

## ADR-008: Lightweight admin authentication

**Context:** Full IdP integration is out of scope for early stages, but admin endpoints should not be anonymously mutable in shared environments.

**Decision:** When `ADMIN_API_KEY` is set, require matching `x-admin-key` on protected controllers; omit the variable in local dev to disable the check.

**Consequences:** Easy to replace with JWT or mTLS later; misconfiguration leaves endpoints open only when no key is configured.

## ADR-009: Integration ports in `integration-sdk`

**Context:** Real Gmail, Calendar, and Jira adapters will arrive later; domain code should depend on narrow interfaces.

**Decision:** Define `MailProvider`, `CalendarProvider`, `TaskProvider`, and `TelegramTransport` in `@wilson/integration-sdk` with mock implementations for tests and scaffolding.

**Consequences:** Adapters can be added per provider without changing orchestrator command names; duplicate high-level `IntegrationClient` types from stage 1 were folded into these ports.
