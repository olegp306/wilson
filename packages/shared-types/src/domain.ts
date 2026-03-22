export type AgentName =
  | 'orchestrator'
  | 'telegram-bot'
  | 'admin-api'
  | 'mail-agent'
  | 'task-agent'
  | 'calendar-agent';

export enum EmployeeRole {
  Admin = 'ADMIN',
  Manager = 'MANAGER',
  Member = 'MEMBER',
}

export enum IntegrationProvider {
  GoogleWorkspace = 'GOOGLE_WORKSPACE',
  Microsoft365 = 'MICROSOFT_365',
  /** Google Calendar API (distinct from mail workspace when scopes differ) */
  GoogleCalendar = 'GOOGLE_CALENDAR',
  /** Jira Cloud / JSM REST */
  JiraCloud = 'JIRA_CLOUD',
  /** Generic IMAP (on-prem or non-Gmail) */
  GenericImap = 'GENERIC_IMAP',
  Slack = 'SLACK',
  Telegram = 'TELEGRAM',
  GenericSmtp = 'GENERIC_SMTP',
}

export enum WorkflowStatus {
  Pending = 'PENDING',
  Running = 'RUNNING',
  Succeeded = 'SUCCEEDED',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED',
}

export enum AuditAction {
  Create = 'CREATE',
  Update = 'UPDATE',
  Delete = 'DELETE',
  Login = 'LOGIN',
  ConfigChange = 'CONFIG_CHANGE',
}
