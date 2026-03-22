import type { CalendarDayQuery, CalendarEventRef, CalendarProvider } from './calendar';
import type { TenantExecutionContext } from './context';
import type {
  MailDraftReplyInput,
  MailDraftReplyResult,
  MailListQuery,
  MailMessageRef,
  MailProvider,
} from './mail';
import type {
  CreateTaskFromMailInput,
  CreateTaskFromMailResult,
  TaskListQuery,
  TaskProvider,
  TaskRef,
} from './tasks';
import type { TelegramTransport } from './telegram';

/** Empty implementations for tests or “no integration” mode. */
export class MockMailProvider implements MailProvider {
  readonly transportKind = 'mock' as const;

  async listRecentMessages(): Promise<MailMessageRef[]> {
    return [];
  }

  async generateDraftReply(
    ctx: TenantExecutionContext,
    input: MailDraftReplyInput,
  ): Promise<MailDraftReplyResult> {
    void ctx;
    return {
      messageId: input.messageId ?? 'msg_unknown',
      draft: '',
      tone: input.tone ?? 'professional',
    };
  }
}

export class MockCalendarProvider implements CalendarProvider {
  readonly transportKind = 'mock' as const;

  async listEventsForDay(): Promise<CalendarEventRef[]> {
    return [];
  }

  async listEventsForRange(): Promise<CalendarEventRef[]> {
    return [];
  }
}

export class MockTaskProvider implements TaskProvider {
  readonly transportKind = 'mock' as const;

  async listMyTasks(): Promise<TaskRef[]> {
    return [];
  }

  async createTaskFromMail(
    ctx: TenantExecutionContext,
    input: CreateTaskFromMailInput,
  ): Promise<CreateTaskFromMailResult> {
    void ctx;
    return {
      taskId: 'mock',
      title: input.titleHint ?? 'stub',
      created: false,
      sourceMessageId: input.messageId,
    };
  }
}

/** Local dev defaults: same behaviour as pre-integration mock HTTP handlers. */
export class DevMailProvider implements MailProvider {
  readonly transportKind = 'mock' as const;

  async listRecentMessages(
    ctx: TenantExecutionContext,
    query: MailListQuery,
  ): Promise<MailMessageRef[]> {
    void ctx;
    const now = Date.now();
    const cap = Math.max(1, query.limit);
    const all: MailMessageRef[] = [
      {
        id: 'msg_wl_8a2c',
        from: 'it-alerts@acme.example',
        subject: '[Scheduled] VPN maintenance · tonight 23:00 UTC',
        receivedAt: new Date(now - 25 * 60 * 1000).toISOString(),
        snippet:
          'Maintenance will affect remote access for approximately 20 minutes. Failover paths will stay active for production API…',
        threadId: 'thr_wl_441',
      },
      {
        id: 'msg_wl_7ff1',
        from: 'peopleops@acme.example',
        subject: 'Action required: benefits enrollment closes Friday',
        receivedAt: new Date(now - 3 * 3600000).toISOString(),
        snippet:
          'Please confirm dependents and tier selections in the HR portal. Questions: reply to this thread…',
        threadId: 'thr_wl_902',
      },
    ];
    return all.slice(0, cap);
  }

  async generateDraftReply(
    ctx: TenantExecutionContext,
    input: MailDraftReplyInput,
  ): Promise<MailDraftReplyResult> {
    void ctx;
    const tone = input.tone ?? 'professional';
    const messageId = input.messageId ?? 'msg_wl_8a2c';
    const draftBody =
      tone === 'casual'
        ? "Thanks for the heads-up — I'll keep an eye on alerts during the window."
        : tone === 'brief'
          ? 'Acknowledged. Monitoring alerts during the maintenance window.'
          : 'Thank you for the update. I acknowledge the maintenance window and will monitor alerts and escalation paths as needed.';
    return { messageId, draft: draftBody, tone };
  }
}

export class DevCalendarProvider implements CalendarProvider {
  readonly transportKind = 'mock' as const;

  async listEventsForDay(
    ctx: TenantExecutionContext,
    query: CalendarDayQuery,
  ): Promise<CalendarEventRef[]> {
    void ctx;
    const parts = query.date.split('-').map((x) => Number.parseInt(x, 10));
    const day = new Date(parts[0], parts[1] - 1, parts[2]);

    const standupStart = new Date(day);
    standupStart.setHours(9, 30, 0, 0);
    const standupEnd = new Date(standupStart);
    standupEnd.setMinutes(standupStart.getMinutes() + 15);

    const reviewStart = new Date(day);
    reviewStart.setHours(14, 0, 0, 0);
    const reviewEnd = new Date(reviewStart);
    reviewEnd.setHours(15, 0, 0, 0);

    return [
      {
        id: 'cal_wl_9f3a',
        title: 'Engineering stand-up',
        start: standupStart.toISOString(),
        end: standupEnd.toISOString(),
        location: 'Google Meet · wilson-eng.daily',
        organizerEmail: 'lead.engineer@acme.example',
      },
      {
        id: 'cal_wl_2b81',
        title: 'Calendar agent design review',
        start: reviewStart.toISOString(),
        end: reviewEnd.toISOString(),
        location: 'Conf room Orion / hybrid',
        organizerEmail: 'product@acme.example',
      },
    ];
  }

  async listEventsForRange(
    ctx: TenantExecutionContext,
    range: { startIso: string; endIso: string },
  ): Promise<CalendarEventRef[]> {
    const start = range.startIso.slice(0, 10);
    return this.listEventsForDay(ctx, { date: start, timeZone: undefined });
  }
}

export class MockTelegramTransport implements TelegramTransport {
  async sendText(): Promise<void> {
    return;
  }
}

export class DevTaskProvider implements TaskProvider {
  readonly transportKind = 'mock' as const;

  async listMyTasks(ctx: TenantExecutionContext, query?: TaskListQuery): Promise<TaskRef[]> {
    void ctx;
    void query;
    return [
      {
        id: 'WL-1842',
        title: 'Finalize Wilson rollout checklist (security review)',
        status: 'in_progress',
        dueAt: new Date(Date.now() + 36 * 3600000).toISOString(),
      },
      {
        id: 'WL-1839',
        title: 'Sync with IT on SSO cutover window',
        status: 'open',
        dueAt: new Date(Date.now() + 4 * 86400000).toISOString(),
      },
      {
        id: 'WL-1801',
        title: 'Document agent failure modes for on-call',
        status: 'blocked',
        dueAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];
  }

  async createTaskFromMail(
    ctx: TenantExecutionContext,
    input: CreateTaskFromMailInput,
  ): Promise<CreateTaskFromMailResult> {
    void ctx;
    const messageId =
      typeof input.messageId === 'string' && input.messageId.length > 0 ? input.messageId : 'msg-unknown';
    const titleHint =
      typeof input.titleHint === 'string' && input.titleHint.length > 0
        ? input.titleHint
        : 'Follow up on message';
    return {
      taskId: `WL-FM-${messageId.slice(0, 8)}`,
      title: titleHint,
      created: true,
      sourceMessageId: messageId,
    };
  }
}
