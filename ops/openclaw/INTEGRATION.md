# OpenClaw + Wilson Integration Guide

This guide explains how to run Wilson as an HTTP agent backend for OpenClaw on the same Ubuntu server.

## Architecture

- OpenClaw gateway/UI: `127.0.0.1:18789`
- Wilson orchestrator: `127.0.0.1:3020`
- Wilson task-agent: `127.0.0.1:3011`
- Wilson calendar-agent: `127.0.0.1:3012`
- Wilson mail-agent: `127.0.0.1:3013`

OpenClaw should call Wilson through a single endpoint:

- `POST http://127.0.0.1:3020/dispatch`

Wilson then routes commands to the right internal agent by `type`.

## Prerequisites

- Ubuntu server with OpenClaw installed (for example via `ops/openclaw/install.sh`)
- Wilson repository cloned on server (for example `/opt/wilson`)
- PostgreSQL reachable from Wilson (`DATABASE_URL`)
- Node.js 20+ and pnpm 9

## 1) Configure Wilson environment

In Wilson `.env` (or `/etc/wilson.env` if using systemd), define at minimum:

```bash
ORCHESTRATOR_PORT=3020
TASK_AGENT_URL=http://127.0.0.1:3011
CALENDAR_AGENT_URL=http://127.0.0.1:3012
MAIL_AGENT_URL=http://127.0.0.1:3013
DATABASE_URL=postgresql://...
```

Optional but recommended for OpenClaw caller identity:

```bash
OPENCLAW_TENANT_ID=11111111-1111-4111-8111-1111111111a1
OPENCLAW_EMPLOYEE_ID=22222222-2222-4222-8222-2222222222a2
```

## 2) One-command helper script

Use the helper script from Wilson repository:

```bash
bash ops/openclaw/wilson-openclaw.sh all --repo /opt/wilson
```

What `all` does:

1. `pnpm install --frozen-lockfile`
2. `pnpm run build`
3. `pnpm prisma migrate deploy`
4. Start Wilson (`systemd` target if available, otherwise `pnpm run prod:start`)
5. Health checks on agents and orchestrator
6. Smoke dispatch call to `/dispatch`

## 3) Script command reference

```bash
# Build + migrate only
bash ops/openclaw/wilson-openclaw.sh build --repo /opt/wilson

# Start services only
bash ops/openclaw/wilson-openclaw.sh start --repo /opt/wilson

# Health checks only
bash ops/openclaw/wilson-openclaw.sh health --repo /opt/wilson

# Dispatch smoke test only
bash ops/openclaw/wilson-openclaw.sh smoke --repo /opt/wilson
```

## 4) Connect OpenClaw to Wilson (no OpenClaw config file yet)

When creating the OpenClaw HTTP tool/integration, use:

- Method: `POST`
- URL: `http://127.0.0.1:3020/dispatch`
- Header: `Content-Type: application/json`

Example body:

```json
{
  "type": "GET_MY_TASKS",
  "tenantId": "11111111-1111-4111-8111-1111111111a1",
  "employeeId": "22222222-2222-4222-8222-2222222222a2"
}
```

## 5) Supported command types

- `GET_MY_TASKS`
- `GET_MY_CALENDAR`
- `GET_LATEST_EMAILS`
- `GET_LATEST_MAIL_SUMMARY`
- `GENERATE_DRAFT_REPLY`
- `CREATE_CALENDAR_EVENT`
- `CREATE_TASK_FROM_MAIL`

## 6) Operational notes

- Keep OpenClaw and Wilson on loopback (`127.0.0.1`) and expose externally only via reverse proxy if needed.
- If systemd units are installed, use `sudo systemctl status wilson.target` and `journalctl -u 'wilson-*' -f`.
- If systemd units are not installed yet, Wilson helper scripts still work (`pnpm run prod:start` / `pnpm run prod:health`).
