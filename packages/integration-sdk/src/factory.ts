import type { IntegrationCredentials } from './credentials';
import type { CalendarProvider } from './calendar';
import type { MailProvider } from './mail';
import type { TaskProvider } from './tasks';
import { DevCalendarProvider, DevMailProvider, DevTaskProvider } from './stubs';

/**
 * Nest / DI token for wiring. Agents resolve providers from a hub (stub today; DB-backed in Stage 3).
 */
export const WILSON_INJECTION = {
  MAIL_PROVIDER: 'WILSON_MAIL_PROVIDER',
  CALENDAR_PROVIDER: 'WILSON_CALENDAR_PROVIDER',
  TASK_PROVIDER: 'WILSON_TASK_PROVIDER',
} as const;

/**
 * Factory for tenant-scoped integration providers. Stage 2 returns static dev stubs.
 * Stage 3: implement with Prisma lookup on `IntegrationConnection` + OAuth token refresh.
 */
export interface IntegrationHub {
  mailProvider(credentials?: IntegrationCredentials): MailProvider;
  calendarProvider(credentials?: IntegrationCredentials): CalendarProvider;
  taskProvider(credentials?: IntegrationCredentials): TaskProvider;
}

let singletonHub: DevIntegrationHub | undefined;

function createDevHub(): DevIntegrationHub {
  return new DevIntegrationHub();
}

/** Dev / CI: singleton `Dev*` providers (ignores credentials until Stage 3). */
export function createStubIntegrationHub(): IntegrationHub {
  if (!singletonHub) {
    singletonHub = createDevHub();
  }
  return singletonHub;
}

class DevIntegrationHub implements IntegrationHub {
  private readonly mail = new DevMailProvider();
  private readonly calendar = new DevCalendarProvider();
  private readonly task = new DevTaskProvider();

  mailProvider(credentials?: IntegrationCredentials): MailProvider {
    void credentials;
    // TODO(stage-3): select GmailProvider vs ImapMailProvider from credentials.provider + vault secret shape.
    return this.mail;
  }

  calendarProvider(credentials?: IntegrationCredentials): CalendarProvider {
    void credentials;
    // TODO(stage-3): select GoogleCalendarProvider from `IntegrationProvider.GoogleCalendar` + OAuth tokens.
    return this.calendar;
  }

  taskProvider(credentials?: IntegrationCredentials): TaskProvider {
    void credentials;
    // TODO(stage-3): select JiraTaskProvider when credentials.provider === IntegrationProvider.JiraCloud.
    return this.task;
  }
}
