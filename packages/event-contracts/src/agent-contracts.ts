import { z } from 'zod';
import type { JsonValue } from '@wilson/shared-types';
import type { OrchestratorCommandType } from './orchestrator-commands';

export const WILSON_HTTP_HEADERS = {
  correlationId: 'x-correlation-id',
  tenantId: 'x-tenant-id',
  employeeId: 'x-employee-id',
} as const;

export type AgentKey = 'task-agent' | 'calendar-agent' | 'mail-agent';

export interface AgentHttpRoute {
  readonly agentKey: AgentKey;
  readonly baseUrlEnv: string;
  readonly path: string;
  readonly method: 'GET' | 'POST';
}

export const AGENT_HTTP_ROUTES: Record<OrchestratorCommandType, AgentHttpRoute> = {
  GET_MY_TASKS: {
    agentKey: 'task-agent',
    baseUrlEnv: 'TASK_AGENT_URL',
    path: '/tasks/me',
    method: 'GET',
  },
  GET_MY_CALENDAR: {
    agentKey: 'calendar-agent',
    baseUrlEnv: 'CALENDAR_AGENT_URL',
    path: '/calendar/today',
    method: 'GET',
  },
  GET_LATEST_MAIL_SUMMARY: {
    agentKey: 'mail-agent',
    baseUrlEnv: 'MAIL_AGENT_URL',
    path: '/mail/summary',
    method: 'GET',
  },
  GET_LATEST_EMAILS: {
    agentKey: 'mail-agent',
    baseUrlEnv: 'MAIL_AGENT_URL',
    path: '/mail/latest',
    method: 'GET',
  },
  GENERATE_DRAFT_REPLY: {
    agentKey: 'mail-agent',
    baseUrlEnv: 'MAIL_AGENT_URL',
    path: '/mail/draft-reply',
    method: 'POST',
  },
  CREATE_TASK_FROM_MAIL: {
    agentKey: 'task-agent',
    baseUrlEnv: 'TASK_AGENT_URL',
    path: '/tasks/from-mail',
    method: 'POST',
  },
  CREATE_CALENDAR_EVENT: {
    agentKey: 'calendar-agent',
    baseUrlEnv: 'CALENDAR_AGENT_URL',
    path: '/calendar/events',
    method: 'POST',
  },
};

const taskStatusSchema = z.enum(['open', 'in_progress', 'blocked', 'done', 'cancelled']);

export const taskItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: taskStatusSchema,
  dueAt: z.string().datetime(),
});

export const taskListResponseSchema = z.object({
  tasks: z.array(taskItemSchema),
});

export type TaskListResponse = z.infer<typeof taskListResponseSchema>;

export const calendarEventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  start: z.string().datetime(),
  end: z.string().datetime(),
  location: z.string().optional(),
  organizerEmail: z.string().email().optional(),
});

export const calendarTodayResponseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone: z.string().min(1).optional(),
  events: z.array(calendarEventSchema),
});

export type CalendarTodayResponse = z.infer<typeof calendarTodayResponseSchema>;

export const mailMessageSnippetSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  subject: z.string().min(1),
  receivedAt: z.string().datetime(),
  snippet: z.string(),
  threadId: z.string().optional(),
});

export const mailSummaryResponseSchema = z.object({
  unreadCount: z.number().int().min(0),
  latest: z.array(mailMessageSnippetSchema),
  /** Optional short LLM or heuristic digest of the latest thread subjects. */
  briefSummary: z.string().optional(),
});

export type MailSummaryResponse = z.infer<typeof mailSummaryResponseSchema>;

export const mailLatestEmailItemSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  subject: z.string().min(1),
  receivedAt: z.string().datetime(),
  bodyPreview: z.string(),
  snippet: z.string(),
});

export const mailLatestEmailsResponseSchema = z.object({
  emails: z.array(mailLatestEmailItemSchema),
});

export type MailLatestEmailsResponse = z.infer<typeof mailLatestEmailsResponseSchema>;

export const mailDraftReplyResponseSchema = z.object({
  messageId: z.string().min(1),
  draft: z.string().min(1),
  tone: z.string().min(1),
});

export type MailDraftReplyResponse = z.infer<typeof mailDraftReplyResponseSchema>;

export const createTaskFromMailResponseSchema = z.object({
  taskId: z.string().min(1),
  title: z.string().min(1),
  created: z.boolean(),
  sourceMessageId: z.string().optional(),
});

export type CreateTaskFromMailResponse = z.infer<typeof createTaskFromMailResponseSchema>;

export const createCalendarEventPayloadSchema = z
  .object({
    title: z.string().min(1),
    startIso: z.string().datetime(),
    endIso: z.string().datetime(),
    location: z.string().optional(),
  })
  .strict();

export type CreateCalendarEventPayload = z.infer<typeof createCalendarEventPayloadSchema>;

export const createCalendarEventResponseSchema = z.object({
  eventId: z.string().min(1),
  htmlLink: z.string().url().optional(),
});

export type CreateCalendarEventResponse = z.infer<typeof createCalendarEventResponseSchema>;

const responseSchemaByCommand: Record<OrchestratorCommandType, z.ZodTypeAny> = {
  GET_MY_TASKS: taskListResponseSchema,
  GET_MY_CALENDAR: calendarTodayResponseSchema,
  GET_LATEST_MAIL_SUMMARY: mailSummaryResponseSchema,
  GET_LATEST_EMAILS: mailLatestEmailsResponseSchema,
  GENERATE_DRAFT_REPLY: mailDraftReplyResponseSchema,
  CREATE_TASK_FROM_MAIL: createTaskFromMailResponseSchema,
  CREATE_CALENDAR_EVENT: createCalendarEventResponseSchema,
};

export function parseAgentResponseBody(
  commandType: OrchestratorCommandType,
  body: unknown,
):
  | { ok: true; data: JsonValue }
  | { ok: false; code: 'AGENT_CONTRACT_VIOLATION'; message: string; details: unknown } {
  const schema = responseSchemaByCommand[commandType];
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      code: 'AGENT_CONTRACT_VIOLATION',
      message: 'Agent response does not match the published contract',
      details: parsed.error.flatten(),
    };
  }
  return { ok: true, data: parsed.data as JsonValue };
}

const emptyPayloadSchema = z.object({}).strict();

export const generateMailDraftReplyPayloadSchema = z
  .object({
    messageId: z.string().min(1).optional(),
    tone: z.enum(['professional', 'casual', 'brief']).optional(),
  })
  .strict();

export type GenerateMailDraftReplyPayload = z.infer<typeof generateMailDraftReplyPayloadSchema>;

export const createTaskFromMailPayloadSchema = z
  .object({
    messageId: z.string().min(1).optional(),
    titleHint: z.string().min(1).optional(),
  })
  .strict();

export type CreateTaskFromMailPayload = z.infer<typeof createTaskFromMailPayloadSchema>;

export function validateOrchestratorPayload(
  commandType: OrchestratorCommandType,
  payload: unknown,
): { ok: true; value: JsonValue } | { ok: false; message: string; details?: unknown } {
  switch (commandType) {
    case 'GET_MY_TASKS':
    case 'GET_MY_CALENDAR':
    case 'GET_LATEST_MAIL_SUMMARY':
    case 'GET_LATEST_EMAILS': {
      const r = emptyPayloadSchema.safeParse(payload ?? {});
      if (!r.success) {
        return { ok: false, message: 'Payload must be an empty object', details: r.error.flatten() };
      }
      return { ok: true, value: {} };
    }
    case 'GENERATE_DRAFT_REPLY': {
      const r = generateMailDraftReplyPayloadSchema.safeParse(payload ?? {});
      if (!r.success) {
        return { ok: false, message: 'Invalid draft-reply payload', details: r.error.flatten() };
      }
      return { ok: true, value: r.data as JsonValue };
    }
    case 'CREATE_TASK_FROM_MAIL': {
      const r = createTaskFromMailPayloadSchema.safeParse(payload ?? {});
      if (!r.success) {
        return { ok: false, message: 'Invalid create-task-from-mail payload', details: r.error.flatten() };
      }
      return { ok: true, value: r.data as JsonValue };
    }
    case 'CREATE_CALENDAR_EVENT': {
      const r = createCalendarEventPayloadSchema.safeParse(payload ?? {});
      if (!r.success) {
        return { ok: false, message: 'Invalid create-calendar-event payload', details: r.error.flatten() };
      }
      return { ok: true, value: r.data as JsonValue };
    }
  }
}
