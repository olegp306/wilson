# Stage 3 — Real integrations (MVP)

Stage 3 adds **working** Telegram polling, **IMAP** mail fetch (on demand), **Google Calendar** list/create, and **admin-api** wiring for integrations and Telegram binding—without full sync engines or background mailbox indexing.

## Supported providers

| Domain | Provider | Notes |
|--------|----------|--------|
| Telegram | Bot API (long polling) | Token via `TELEGRAM_BOT_TOKEN`. No token → dev HTTP simulator. |
| Email | IMAP (`GENERIC_IMAP` or provider name containing `IMAP`) | Credentials in `IntegrationConnection.encryptedSecret` as JSON (see mail-agent). Optional env `IMAP_*` for local experiments only. |
| Calendar | Google Calendar API | Service account or OAuth client JSON in integration secret; see `apps/calendar-agent` and `google-calendar.client.ts`. |

## How integrations are resolved

1. **Tenant isolation**: Every agent request carries `x-tenant-id` and optional `x-employee-id` (from orchestrator).
2. **IntegrationConnection** rows (`kind`: `EMAIL` | `CALENDAR`) store `provider`, `encryptedSecret` (JSON credentials for MVP—**not encrypted at rest yet**; treat DB access as sensitive).
3. Resolvers prefer an **employee-specific** connection, then a **tenant-wide** row (`employeeId` null).
4. **`MAIL_FORCE_MOCK=1`** / **`CALENDAR_FORCE_MOCK=1`** forces dev/mock providers even if DB has integrations.

## Orchestrator flows (Telegram → agents)

| Telegram / dev command | Orchestrator command | Agent |
|------------------------|----------------------|--------|
| `/tasks` | `GET_MY_TASKS` | task-agent |
| `/calendar` | `GET_MY_CALENDAR` | calendar-agent |
| `/mail` | `GET_LATEST_EMAILS` | mail-agent (IMAP fetch) |
| `/mail-summary` | `GET_LATEST_MAIL_SUMMARY` | mail-agent |
| `/draft-reply` | `GENERATE_DRAFT_REPLY` | mail-agent |
| `/newevent` | `CREATE_CALENDAR_EVENT` | calendar-agent |

No command **sends** email. Calendar **create** only runs on explicit `/newevent` (or API); the bot shows a short confirmation line first.

## Admin: link Telegram

1. User opens Telegram, sends `/start`; copy their **numeric user id** from the bot’s reply (or Telegram client).
2. Admin calls `POST /api/tenants/:tenantId/telegram-bindings` with `employeeId`, `telegramUserId`, optional `telegramUsername` (see admin-api Swagger).

## Admin: create email integration

`POST /api/tenants/:tenantId/integrations` with `kind: EMAIL`, `provider` (e.g. `GENERIC_IMAP`), `displayName`, `encryptedSecret` as JSON string, e.g.:

```json
{
  "host": "imap.example.com",
  "port": 993,
  "secure": true,
  "user": "user@example.com",
  "password": "app-password"
}
```

Optionally set `employeeId` to scope to one employee.

## Admin: create calendar integration

Same endpoint with `kind: CALENDAR`, `provider` containing `GOOGLE`, and `encryptedSecret` set to your Google OAuth or service account JSON (as stored string).

## Limitations (by design)

- No full mailbox sync; **latest N** messages only.
- No automatic retries beyond normal HTTP.
- Credentials in DB are **plain JSON** for MVP (documented; encrypt in a later stage).
- Google setup is minimal (one calendar per integration secret).

## What is still mocked

- Task agent remains mock-oriented unless extended separately.
- If no integration or `*_FORCE_MOCK=1`, mail/calendar fall back to **dev providers** (static or safe defaults).

## Security notes

- Do not commit real secrets; use `.env` locally and restrict DB access.
- Wilson **never** auto-sends mail; draft replies are suggestions only.
- Calendar events are created only when the user explicitly invokes `/newevent` (or future explicit flows).
