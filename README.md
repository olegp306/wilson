# Wilson

Wilson is a modular enterprise assistant platform: one orchestrator coordinates multiple agents (task, calendar, mail, and more), while admins configure tenants, employees, roles, and integrations. Employees interact primarily through Telegram.

This repository is a **pnpm + Turborepo** monorepo with **TypeScript**, **NestJS** services, **Prisma** for PostgreSQL, **NATS** (in Docker) reserved for future broker-backed messaging, and an **in-memory message bus** inside the orchestrator for local command/result fan-out.

## Requirements

- Node.js 20+
- [pnpm](https://pnpm.io/) 9 (`corepack enable` then `corepack prepare pnpm@9.15.0 --activate`, or use `npx pnpm`)
- Docker (for local PostgreSQL, Redis, NATS)

## Install

```bash
pnpm install
```

`postinstall` runs `prisma generate` for the shared schema at `prisma/schema.prisma`. You can also run `pnpm prisma:generate` or `pnpm prisma:validate` explicitly.

## Monorepo layout

| Path | Purpose |
|------|---------|
| `apps/admin-api` | NestJS admin API (tenants, employees, agent toggles) |
| `apps/orchestrator` | Command dispatch, swappable orchestration runtime, in-memory bus |
| `apps/task-agent` | Mock task agent (HTTP) |
| `apps/calendar-agent` | Calendar agent (HTTP) — Google Calendar when integrated, else dev mock |
| `apps/mail-agent` | Mail agent (HTTP) — IMAP fetch on demand when integrated, else dev mock |
| `apps/telegram-bot` | Telegraf bot + dev simulation HTTP server |
| `packages/shared-types` | Branded IDs, enums, shared DTO shapes |
| `packages/event-contracts` | Commands, events, messaging interfaces |
| `packages/logger` | Structured logging (pino) |
| `packages/config` | Environment loading helpers (zod); Stage 3 optional vars (Telegram, IMAP, OpenAI, Google) |
| `packages/auth` | Auth primitives for future extension |
| `packages/integration-sdk` | Provider ports (mail, calendar, task, Telegram transport), stubs, and `IntegrationHub` factory |
| `packages/db` | Shared Prisma helpers (audit, workflow runs) |
| `prisma/` | Prisma schema, migrations, seed |
| `infra/docker` | Docker Compose for infrastructure |
| `docs/` | Architecture and ADR-style notes |

## Infrastructure (Docker)

From the repo root:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

This starts **PostgreSQL 16**, **Redis 7**, and **NATS 2** (with JetStream enabled). Redis and NATS are not required for the mock HTTP flows in this stage but are part of the local stack for upcoming features.

Copy `.env.example` to `.env` and adjust if needed. The default `DATABASE_URL` matches the Compose Postgres credentials.

## Database migrations and seed

With Postgres running and `DATABASE_URL` set:

```bash
pnpm prisma:migrate
```

For production-like deploys:

```bash
pnpm prisma:migrate:deploy
```

Seed demo data (fixed demo tenant and employee IDs):

```bash
pnpm prisma:seed
```

Demo IDs (also in `.env.example`; see `prisma/seed.ts`):

- Tenant: `11111111-1111-4111-8111-111111111111`
- Admin employee: `22222222-2222-4222-8222-222222222222`
- Member employee (reports to admin): `33333333-3333-4333-8333-333333333333`

## Run services locally

Set agent URLs for the orchestrator (defaults match `.env.example`):

```bash
TASK_AGENT_URL=http://localhost:3011
CALENDAR_AGENT_URL=http://localhost:3012
MAIL_AGENT_URL=http://localhost:3013
ORCHESTRATOR_PORT=3020
```

After `pnpm run build`, start what you need. Either run individual apps (each also runs its own `dev` script), or use `pnpm run dev` to start **every** workspace `dev` script (six library `tsc --watch` processes plus six apps). To limit Turbo to apps only, use filters, for example:

```bash
pnpm exec turbo run dev --filter=@wilson/orchestrator --filter=@wilson/task-agent --filter=@wilson/calendar-agent --filter=@wilson/mail-agent
```

Typical per-app commands:

```bash
pnpm --filter @wilson/task-agent dev
pnpm --filter @wilson/calendar-agent dev
pnpm --filter @wilson/mail-agent dev
pnpm --filter @wilson/orchestrator dev
pnpm --filter @wilson/admin-api dev
pnpm --filter @wilson/telegram-bot dev
```

- Admin API: `http://localhost:3000/api` — Swagger at `http://localhost:3000/api/docs` (set `ADMIN_API_KEY` in `.env` and pass `x-admin-key` when mutating data)
- Orchestrator: `http://localhost:3020/api` — Swagger at `http://localhost:3020/api/docs`
- Telegram dev simulation (no bot token): `http://localhost:3030/health` and `POST /dev/simulate` with `{ "command": "/tasks" }` — also `/calendar`, `/mail`, `/mail-summary`, `/draft-reply`, `/newevent`

## Mock end-to-end flows

With orchestrator and all three agents running:

```bash
pnpm simulate:flows
```

This exercises flows **A–F** (tasks, calendar, mail summary, latest mail, draft reply, create calendar event) the same way the Telegram bot maps `/tasks`, `/calendar`, `/mail-summary`, `/mail`, `/draft-reply`, and `/newevent`. Aliased as `pnpm demo:telegram`.

## Telegram

1. Run Postgres, migrate, seed (`pnpm prisma:migrate`, `pnpm prisma:seed`).
2. Link your Telegram user to an employee: `POST /api/tenants/{tenantId}/telegram-bindings` (Swagger: admin-api) with `telegramUserId` from the bot or your Telegram client.
3. Set `TELEGRAM_BOT_TOKEN`, `DATABASE_URL` (bot resolves bindings via Prisma), `ORCHESTRATOR_URL`, and optional `WILSON_TENANT_ID` / `WILSON_EMPLOYEE_ID` fallbacks for dev.
4. Start orchestrator + agents, then: `pnpm telegram:bot` (or `pnpm --filter @wilson/telegram-bot dev`).

Without a token, the process starts the **dev simulation** HTTP server instead of polling Telegram.

Example bot commands: `/start`, `/tasks`, `/calendar`, `/mail`, `/mail-summary`, `/draft-reply`, `/newevent` (demo calendar block; does not send email).

## Email (IMAP) and calendar (Google)

1. Create integrations via admin-api (`kind`: `EMAIL` or `CALENDAR`). Store IMAP JSON or Google credential JSON in `encryptedSecret` (plain JSON for MVP — see [docs/stage-3.md](docs/stage-3.md)).
2. Set agent URLs on the orchestrator (`MAIL_AGENT_URL`, `CALENDAR_AGENT_URL`).
3. Optional: `MAIL_FORCE_MOCK=1` / `CALENDAR_FORCE_MOCK=1` to keep dev mocks.

Quick mail-agent check without orchestrator: `pnpm test:mail:latest` (requires mail-agent running).

## Scripts

All workspaces expose **`build`**, **`dev`**, and **`clean`** (`rimraf dist`). Nest apps also expose **`start`**. Linting is run from the **repository root** only (`pnpm run lint`).

| Command | Description |
|---------|-------------|
| `pnpm run build` | Turborepo build for all packages and apps |
| `pnpm run dev` | Run all `dev` scripts in parallel (package watchers + app servers) |
| `pnpm run clean` | `turbo run clean` then remove root `node_modules` |
| `pnpm run test` | `prisma generate` + Vitest (uses [vitest.config.ts](vitest.config.ts) aliases to workspace **source**; no Turbo required) |
| `pnpm run test:with-build` | Full Turborepo build, then Vitest (use before release or when verifying compiled apps) |
| `pnpm run test:unit` | Vitest only (skips `prisma generate`; use when the client is already generated) |
| `pnpm run lint` | ESLint on apps, packages, tests, infra scripts, Prisma seed |
| `pnpm run format` | Prettier write |
| `pnpm run format:check` | Prettier check (CI) |
| `pnpm prisma:generate` | `prisma generate` |
| `pnpm prisma:validate` | `prisma validate` |
| `pnpm prisma:migrate` | `prisma migrate dev` |
| `pnpm prisma:migrate:deploy` | `prisma migrate deploy` |
| `pnpm prisma:seed` / `pnpm db:seed` | Seed demo tenant / employees / agent rows |
| `pnpm db:migrate` | Alias for `prisma migrate dev` |
| `pnpm db:push` | `prisma db push` (prototyping) |
| `pnpm simulate:flows` / `pnpm demo:telegram` | HTTP script: orchestrator → agents (flows A–F) |
| `pnpm telegram:bot` | Run Telegram bot (real token) or dev simulator (no token) |
| `pnpm test:mail:latest` | `GET /mail/latest` on mail-agent (headers from env) |
| `pnpm run prod:build` … `pnpm run prod:health` | Production lifecycle on **Linux** (`ops/wilson.sh`): build, migrate, seed, start/stop/restart, status, health — see **Deploying on a remote Unix server** (section 6) |

## OpenClaw install (Ubuntu)

Use the installer script from this repository:

`ash
bash ops/openclaw/install.sh
`

The script installs Docker Engine + Compose plugin, creates /srv/openclaw/{app,config,workspace}, clones OpenClaw, and exports OPENCLAW_CONFIG_DIR / OPENCLAW_WORKSPACE_DIR.

After script completion:

`ash
# 1) Re-login to apply docker group
exit
ssh <user>@<server-ip>

# 2) Build and onboard
cd /srv/openclaw/app
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard

# 3) Start gateway and verify health
docker compose up -d openclaw-gateway
curl http://127.0.0.1:18789/healthz
`

To open UI securely from your workstation, use SSH tunnel:

`ash
ssh -N -L 18789:127.0.0.1:18789 <user>@<server-ip>
`

Then open http://127.0.0.1:18789/#token=YOUR_TOKEN locally.

## Deploying on a remote Unix server

Use this when Wilson runs on a **Linux or other Unix-like host** (VPS, bare metal, or a container host) that you reach over SSH. Commands below assume a **POSIX shell**; always verify which shell and terminal you are using.

### 1. Check your terminal and shell

SSH sessions and scripts behave differently depending on the **login shell** and whether you are **interactive** or **non-interactive**. Run these on the server after you log in:

```bash
# Operating system and kernel
uname -a

# Default login shell for your user (from /etc/passwd)
echo "$SHELL"

# Name of the shell running this session (often bash or dash on Debian/Ubuntu)
ps -p $$ -o comm=

# If interactive, $0 is usually the shell name (e.g. -bash for bash)
echo "$0"

# Terminal type (TERM): ncurses/less; often "dumb" or "xterm" over SSH
echo "$TERM"

# Whether stdin is a TTY (interactive terminal vs script/cron)
if [ -t 0 ]; then echo "stdin is a TTY"; else echo "stdin is not a TTY"; fi
```

**What to look for**

| Check | Typical meaning |
|-------|-----------------|
| `SHELL` is `/bin/bash` | Bash is your login shell; README `bash` snippets work as-is. |
| `SHELL` is `/bin/sh` or `dash` | On Debian/Ubuntu, `/bin/sh` is often **dash**, not bash. Use `bash -lc 'command'` for bash-specific features, or run `bash` explicitly before following multi-line scripts. |
| `SHELL` is `/bin/zsh` | Zsh is compatible with most bash examples here; use `~/.zshrc` instead of `~/.bashrc` for persistent env vars. |
| `TERM` is `dumb` or unset | Common in **non-interactive** sessions (CI, some SSH without TTY). Wilson does not need a graphical terminal; builds and `pnpm` work fine. |
| `TERM` is `xterm-256color`, `screen`, etc. | Normal interactive SSH; optional for editors and pagers. |

**Why this matters**

- Wilson does not require a specific terminal emulator (xterm, iTerm, Windows Terminal, etc.); deployment is **server-side**.
- **pnpm** and **Node** install instructions differ if your login shell does not load `~/.bashrc` (e.g. non-interactive SSH). Put `export PATH=...` in `~/.profile` or systemd `Environment=` for production paths.
- If a script fails with `[[` not found or `source` not found, you are not in **bash**; invoke `bash` or rewrite for POSIX `sh`.

### 2. Server prerequisites

| Requirement | Notes |
|-------------|--------|
| **Node.js 20+** | Install via [NodeSource](https://github.com/nodesource/distributions), [nvm](https://github.com/nvm-sh/nvm), or your distro package. Verify: `node -v`. |
| **pnpm 9** | `corepack enable` then `corepack prepare pnpm@9.15.0 --activate`, or install via npm. Verify: `pnpm -v`. |
| **Git** | To clone and update the repo. |
| **PostgreSQL** | Docker Compose from this repo (`infra/docker/docker-compose.yml`) or a managed database; set `DATABASE_URL`. |
| **Docker** (optional) | If you use Compose for Postgres/Redis/NATS on the same host. |

Open only the ports you need in **firewall** (e.g. `ufw`, `firewalld`, cloud security groups). Default ports in `.env.example`:

| Service | Port (default) |
|---------|----------------|
| admin-api | 3000 |
| task-agent | 3011 |
| calendar-agent | 3012 |
| mail-agent | 3013 |
| orchestrator | 3020 |
| telegram-bot dev simulator | 3030 |

In production, prefer a **reverse proxy** (nginx, Caddy) on 443 and keep app ports on **localhost** unless you expose them intentionally.

### 3. Deploy user, directory, and clone

```bash
# Example: dedicated user and directory (adjust paths)
sudo adduser wilson --disabled-password   # or your cloud provider default user
sudo mkdir -p /opt/wilson && sudo chown "$USER:$USER" /opt/wilson
cd /opt/wilson

git clone https://github.com/<your-org>/wilson.git .
# or: git clone <your-ssh-url> .
```

### 4. Environment and secrets

```bash
cp .env.example .env
chmod 600 .env
```

Edit `.env` with production values: `DATABASE_URL`, `ADMIN_API_KEY`, `ORCHESTRATOR_URL`, agent URLs (`TASK_AGENT_URL`, etc.), `TELEGRAM_BOT_TOKEN` if using the bot, and integration-related variables as in [docs/stage-3.md](docs/stage-3.md). Use **HTTPS** URLs internally if you terminate TLS at a proxy.

**Orchestrator URL**: every service that calls the orchestrator must use a **reachable** base URL (e.g. `http://127.0.0.1:3020` if all processes run on the same host).

### 5. Install, build, and database

```bash
cd /opt/wilson   # or your clone path

# If using Docker Compose for Postgres/Redis/NATS on this machine:
docker compose -f infra/docker/docker-compose.yml up -d

pnpm install --frozen-lockfile
pnpm run build              # or: pnpm run prod:build
pnpm prisma:migrate:deploy  # or: pnpm run prod:migrate

# Optional: seed once for demo IDs (not for production tenants)
# pnpm prisma:seed          # or: pnpm run prod:seed
```

### 6. Running services in production

Development uses `pnpm dev` and watchers. On a server, prefer the **production lifecycle scripts** below instead of ad-hoc `nohup` or many parallel `pnpm --filter … start &` shells (which can cause **EADDRINUSE** on the same ports).

**Root commands** (implemented by `ops/wilson.sh`; requires **bash**, **curl**, and **ss** from `iproute2`, as on Ubuntu):

| Command | What it does |
|---------|----------------|
| `pnpm run prod:build` | `turbo run build` (all apps and packages) |
| `pnpm run prod:migrate` | `prisma migrate deploy` |
| `pnpm run prod:seed` | Run `prisma/seed.ts` (demo data) |
| `pnpm run prod:start` | Start every Nest app with **`node dist/main.js`** from each app directory |
| `pnpm run prod:stop` | Stop tracked processes (SIGTERM, then SIGKILL if needed) |
| `pnpm run prod:restart` | Stop then start |
| `pnpm run prod:status` | Show `.wilson/run/*.pid` and whether each PID is alive |
| `pnpm run prod:health` | HTTP checks on default health URLs (see below) |

You can also run `bash ops/wilson.sh <start|stop|restart|status|health|help>` from the repo root.

**Environment:** the script **`source`s `.env`** from the repo root and sets `NODE_ENV=production` when unset.

**State:** PID files under **`.wilson/run/`** and logs under **`.wilson/logs/`** (both gitignored). **Start order:** task-agent (3011) → calendar-agent (3012) → mail-agent (3013) → orchestrator (3020) → admin-api (3000) → telegram-bot.

**Safe re-runs:** `prod:start` skips a service if its pid file still points to a **live** process. If a **port** is already taken by something else, start fails with an explicit message (use `prod:stop` or free the port).

**Telegram bot:** If **`TELEGRAM_BOT_TOKEN`** is set, the bot uses **long polling** and does not rely on the dev HTTP server; `prod:health` **skips** the Telegram HTTP check and suggests `prod:status`. If the token is **unset**, the dev simulator may listen on **3030** (override with **`TELEGRAM_BOT_DEV_PORT`**); `prod:health` checks `http://127.0.0.1:<port>/health` in that case.

**Health checks (`prod:health`):** agents and admin-api use `/health`; orchestrator uses `/api/health`. Respect **`ADMIN_API_PORT`**, **`ORCHESTRATOR_PORT`**, and **`TELEGRAM_BOT_DEV_PORT`** if you override defaults in `.env`.

**Next step for hardening:** map the same **`dist/main.js`** entrypoints to **systemd** units (or another supervisor) with `WorkingDirectory` per app, `EnvironmentFile=` pointing at `.env`, and `Restart=on-failure` — the scripts above are a deliberate stepping-stone toward that layout.

### 7. Reverse proxy and TLS

Put **nginx** or **Caddy** in front of admin-api and/or orchestrator if you expose HTTP APIs to browsers or external tools. Terminate TLS at the proxy; keep Nest apps on loopback ports. The Telegram bot does not need an inbound HTTP port from the internet for **long polling**; allow **outbound HTTPS** to `api.telegram.org`.

### 8. Verify deployment

```bash
pnpm run prod:health
```

Or spot-check Swagger (if exposed):

```bash
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3020/api/docs
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/docs
```

Run `pnpm simulate:flows` on the server when orchestrator and agents use localhost URLs.

### 9. Updates and rollbacks

```bash
cd /opt/wilson
git pull
pnpm install --frozen-lockfile
pnpm run build
pnpm prisma:migrate:deploy
pnpm run prod:restart
# or: restart individual systemd units / pm2 processes if you use those instead
```

Back up `.env` and the database before migrations.

## What is mocked

- **Task agent** still returns **realistic static data** (plus task-from-mail stub) validated against **Zod contracts** in `@wilson/event-contracts`.
- **Mail and calendar agents** use **real IMAP / Google** when `IntegrationConnection` rows exist and `MAIL_FORCE_MOCK` / `CALENDAR_FORCE_MOCK` are not set; otherwise they fall back to dev/static data. All responses are validated against contracts before HTTP return; the orchestrator validates the same contracts on ingress.
- The orchestrator uses **HTTP** and shared header names (`WILSON_HTTP_HEADERS`) to reach agents; **NATS** is available in Docker but not wired into dispatch yet.
- The orchestrator publishes to an **in-memory** `MessageEnvelope` bus (swappable later). When PostgreSQL is up, workflow runs and audit rows are written via `@wilson/db`; if the DB is down, dispatch to agents still works.

## Documentation

- [docs/architecture.md](docs/architecture.md) — components and data flow  
- [docs/stage-3.md](docs/stage-3.md) — Stage 3 integrations, setup, limitations, security  
- [docs/stage-2-notes.md](docs/stage-2-notes.md) — earlier stage notes  
- [docs/decisions.md](docs/decisions.md), [docs/integration-readiness.md](docs/integration-readiness.md)
- [ops/openclaw/INTEGRATION.md](ops/openclaw/INTEGRATION.md) — OpenClaw integration with Wilson orchestrator and helper script

## Next stage (ideas)

Broker-backed messaging, credential encryption, OAuth UX, admin UI, richer providers (Jira, Slack, …).
