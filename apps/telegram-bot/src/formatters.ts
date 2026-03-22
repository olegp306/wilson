import {
  type OrchestratorDispatchResponse,
  calendarTodayResponseSchema,
  createCalendarEventResponseSchema,
  createTaskFromMailResponseSchema,
  mailDraftReplyResponseSchema,
  mailLatestEmailsResponseSchema,
  mailSummaryResponseSchema,
  taskListResponseSchema,
} from '@wilson/event-contracts';

export function formatOrchestratorReply(res: OrchestratorDispatchResponse): string {
  if (!res.outcome.ok) {
    return `Wilson: ${res.outcome.error.code} — ${res.outcome.error.message}`;
  }
  const agent = res.outcome.result.agent;
  const data = res.outcome.result.data;

  const tasks = taskListResponseSchema.safeParse(data);
  if (tasks.success) {
    const lines = tasks.data.tasks.map((t) => `• ${t.title} (${t.status})`);
    return [`Tasks (${agent}):`, ...lines].join('\n');
  }

  const cal = calendarTodayResponseSchema.safeParse(data);
  if (cal.success) {
    const lines = cal.data.events.map((e) => `• ${e.title} — ${e.start}`);
    return [`Calendar (${agent}):`, ...lines].join('\n');
  }

  const latestEmails = mailLatestEmailsResponseSchema.safeParse(data);
  if (latestEmails.success) {
    const lines = latestEmails.data.emails.map(
      (m) => `• ${m.subject} — ${m.from}\n  ${m.bodyPreview.slice(0, 200)}`,
    );
    return [`Latest mail (${agent}):`, ...lines].join('\n');
  }

  const mail = mailSummaryResponseSchema.safeParse(data);
  if (mail.success) {
    const lines = mail.data.latest.map((m) => `• ${m.subject} — ${m.from}`);
    const digest = mail.data.briefSummary ? [`Digest: ${mail.data.briefSummary}`] : [];
    return [`Mail summary (${agent}):`, `Unread: ${mail.data.unreadCount}`, ...digest, ...lines].join(
      '\n',
    );
  }

  const draft = mailDraftReplyResponseSchema.safeParse(data);
  if (draft.success) {
    return [`Draft reply (${agent}):`, `Tone: ${draft.data.tone}`, draft.data.draft].join('\n');
  }

  const fromMail = createTaskFromMailResponseSchema.safeParse(data);
  if (fromMail.success) {
    return [`Task from mail (${agent}):`, fromMail.data.title, `id: ${fromMail.data.taskId}`].join(
      '\n',
    );
  }

  const createdCal = createCalendarEventResponseSchema.safeParse(data);
  if (createdCal.success) {
    const link = createdCal.data.htmlLink ? `\nOpen: ${createdCal.data.htmlLink}` : '';
    return [`Calendar event created (${agent}):`, `id: ${createdCal.data.eventId}`, link].join('\n');
  }

  return `Wilson (${agent}): ${JSON.stringify(data)}`;
}
