# Wilson architecture

## Stage 3 additions

- **Real Telegram** long polling when `TELEGRAM_BOT_TOKEN` is set; otherwise the telegram app serves the **dev simulation** HTTP API (`POST /dev/simulate`).
- **Telegram bindings** (`TelegramBinding.telegramUserId`) resolve Telegram user → employee → tenant for orchestrator context.
- **Mail-agent** uses **IMAP on demand** (`imapflow` + `mailparser`) via `IntegrationConnection` (`kind: EMAIL`); optional OpenAI for summary/draft when `OPENAI_API_KEY` is set; heuristics otherwise.
- **Calendar-agent** uses **Google Calendar** when a `kind: CALENDAR` integration is present; otherwise dev calendar provider.
- **Admin-api** creates/lists/toggles integrations and upserts Telegram bindings.

See [stage-3.md](./stage-3.md) for setup, limitations, and security notes.

---

## Stage 2 baseline

## Main components

| Component | Responsibility |
|-----------|----------------|
| **telegram-bot** | Application-style mapping from Telegram (or dev HTTP) commands to orchestrator HTTP calls; formatting; optional DB audit for received commands. |
| **orchestrator** | Validates commands, maintains **tenant/employee context**, propagates **correlation IDs**, uses **`AGENT_HTTP_ROUTES` / `capabilityForCommand`** from contracts for logging and metadata, runs **OrchestratorApplicationService** (workflow + audit + `OrchestrationRuntime`), and fans out **message envelopes** on an in-memory bus. |
| **Agents** | Domain HTTP services. They do not import each other; contracts live in `@wilson/event-contracts`. |
| **admin-api** | Tenant and employee administration, manager assignment, per-tenant agent configuration, integration stubs; Prisma + optional `x-admin-key` guard. |
| **`@wilson/db`** | Shared Prisma helpers (audit, workflow runs) without coupling to Nest. |
| **Shared packages** | Types (`@wilson/shared-types`), commands and Zod contracts (`@wilson/event-contracts`), integration ports (`@wilson/integration-sdk`), logging (`@wilson/logger`), config (`@wilson/config`). |

## Orchestrator responsibility

- Validate **multi-tenant** context (`tenantId`, optional `employeeId`).
- Map each command to a **capability** and **agent HTTP route** (see `AGENT_HTTP_ROUTES` and `COMMAND_TO_CAPABILITY` in `@wilson/event-contracts`).
- Create **workflow run** records and **audit** dispatch outcome when PostgreSQL is available; continue dispatch if the DB is down.
- Delegate execution to **`OrchestrationRuntime`** (today: HTTP to mock agents using env-based base URLs).
- Emit **message envelopes** on an in-memory bus for local observability and future broker wiring.

## Agent responsibility

- Expose narrow HTTP APIs for their domain (tasks, calendar, mail).
- Return JSON that satisfies Zod contracts validated by the orchestrator; no imports from other agent apps.

## Messaging

- **In-memory** `MessageBus` in the orchestrator implements publish/subscribe for local development.
- **NATS** in Docker Compose remains available for a future `NatsMessageBus` without changing command contracts.

## Data and migrations

- **Prisma** schema at `prisma/schema.prisma`; migrations under `prisma/migrations`.
- **Seed** (`pnpm db:seed` / `pnpm prisma:seed`) provisions demo tenant, employees, and agent rows.

## Why a monorepo for stage 2

- Shared **contracts** and **DB helpers** stay type-aligned across services.
- Clear **package boundaries** (no agent-to-agent imports; orchestration only through HTTP/contracts).

## How to split later

- Publish `@wilson/event-contracts`, `@wilson/db`, and `@wilson/shared-types` as versioned packages.
- Move each `apps/*` service to its own repo; keep contracts as the compatibility layer.
- Swap `OrchestrationRuntime` for NATS/gRPC **without** changing Telegram or admin clients.
