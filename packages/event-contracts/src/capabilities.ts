import type { OrchestratorCommandType } from './orchestrator-commands';

export type AgentCapability =
  | 'wilson.tasks.query.mine'
  | 'wilson.tasks.action.createFromMail'
  | 'wilson.calendar.query.today'
  | 'wilson.calendar.action.createEvent'
  | 'wilson.mail.query.summary'
  | 'wilson.mail.query.latest'
  | 'wilson.mail.action.draftReply';

export const COMMAND_TO_CAPABILITY: Record<OrchestratorCommandType, AgentCapability> = {
  GET_MY_TASKS: 'wilson.tasks.query.mine',
  CREATE_TASK_FROM_MAIL: 'wilson.tasks.action.createFromMail',
  GET_MY_CALENDAR: 'wilson.calendar.query.today',
  GET_LATEST_MAIL_SUMMARY: 'wilson.mail.query.summary',
  GET_LATEST_EMAILS: 'wilson.mail.query.latest',
  GENERATE_DRAFT_REPLY: 'wilson.mail.action.draftReply',
  CREATE_CALENDAR_EVENT: 'wilson.calendar.action.createEvent',
};

export function capabilityForCommand(type: OrchestratorCommandType): AgentCapability {
  return COMMAND_TO_CAPABILITY[type];
}
