# Integration readiness (Stage 3)

For what is implemented today (IMAP, Google Calendar, Telegram binding, env vars), see **[stage-3.md](./stage-3.md)**.

This document describes how **real** mail, calendar, and task providers should be wired without changing Wilson’s public contracts (`@wilson/event-contracts`) or the orchestrator’s HTTP dispatch model.

## Principles

1. **Orchestrator** stays free of vendor SDKs. It only validates commands and calls agents over HTTP with `WILSON_HTTP_HEADERS`.
2. **Agents** (`mail-agent`, `calendar-agent`, `task-agent`) implement HTTP handlers and **must** use ports from `@wilson/integration-sdk` (`MailProvider`, `CalendarProvider`, `TaskProvider`). Inject concrete adapters via Nest `providers` (see `WILSON_INJECTION` tokens).
3. **Credentials** for a tenant live in `IntegrationConnection` (and eventually a vault). Stage 2 stores opaque blobs; Stage 3 will map `IntegrationProvider` + decrypted metadata to a concrete adapter class.

## Provider matrix

| Capability | `@wilson/shared-types` `IntegrationProvider` | `integration-sdk` transport kind | Typical Stage 3 implementation |
|------------|-----------------------------------------------|----------------------------------|------------------------------|
| Mail | `GoogleWorkspace`, `GenericImap`, `GenericSmtp` | `gmail_api`, `imap`, `microsoft_graph_mail` | Gmail API, IMAP (node-imap / mailparser), Microsoft Graph |
| Calendar | `GoogleCalendar`, `Microsoft365` | `google_calendar`, `microsoft_graph_calendar`, `caldav` | Google Calendar API, Graph `/calendarView`, CalDAV |
| Tasks | `JiraCloud` (add more in enum as needed) | `jira`, `linear`, `internal` | Jira REST v3, Linear API, internal DB |

## How to add a real provider (checklist)

1. **Add an adapter class** in a new file (e.g. `packages/integration-sdk/src/adapters/jira-task.provider.ts` or `apps/task-agent/src/adapters/jira-task.provider.ts` if you prefer app-local only) that **implements** `TaskProvider` / `MailProvider` / `CalendarProvider` with the correct `transportKind`.
2. **Map secrets**: decrypt `IntegrationCredentials.encryptedPayload` into OAuth tokens or IMAP host/user/password. Use `metadata` JSON for non-secret routing (e.g. Jira project key, Gmail label).
3. **Replace the stub factory** in `createStubIntegrationHub()` (or introduce `createIntegrationHubFromEnv()` / DB lookup) so `mailProvider(credentials)` returns `new GmailMailProvider(...)` when `credentials.provider === IntegrationProvider.GoogleWorkspace`.
4. **OAuth refresh**: centralize token refresh in a small helper (or Nest injectable) shared by Gmail + Google Calendar if both use the same Google workspace connection.
5. **Keep HTTP contracts**: agents must still return JSON that passes `parseAgentResponseBody` in the orchestrator. Map vendor payloads to Wilson shapes in the **application service** layer, not in the orchestrator.

## Files to touch in Stage 3

| Area | File(s) |
|------|---------|
| Enum / admin | `packages/shared-types` `IntegrationProvider` (already extended for Jira / IMAP / calendar) |
| Ports | `packages/integration-sdk/src/mail.ts`, `calendar.ts`, `tasks.ts` (extend only if a new capability is required) |
| Factory | `packages/integration-sdk/src/factory.ts` — replace stub resolution with DB-backed selection |
| Agents | `*-application.service.ts` in each agent; wire real providers in `app.module.ts` |
| Tests | Add adapter unit tests with mocked HTTP (nock/msw), not live APIs |

## TODO markers in code

Search for `TODO(stage-3)` in `packages/integration-sdk/src/factory.ts` and agent mail service for the next concrete steps.
