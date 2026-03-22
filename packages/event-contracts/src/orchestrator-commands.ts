import type { JsonValue } from '@wilson/shared-types';
import type { CorrelationContext } from './metadata';

export const ORCHESTRATOR_COMMAND_TYPES = [
  'GET_MY_TASKS',
  'GET_MY_CALENDAR',
  'GET_LATEST_MAIL_SUMMARY',
  'GET_LATEST_EMAILS',
  'GENERATE_DRAFT_REPLY',
  'CREATE_TASK_FROM_MAIL',
  'CREATE_CALENDAR_EVENT',
] as const;

export type OrchestratorCommandType = (typeof ORCHESTRATOR_COMMAND_TYPES)[number];

export interface OrchestratorCommandEnvelope {
  type: OrchestratorCommandType;
  context: CorrelationContext;
  payload: JsonValue;
}

export interface OrchestratorSuccessPayload {
  agent: string;
  data: JsonValue;
}

export interface OrchestratorErrorPayload {
  code: string;
  message: string;
  details?: JsonValue;
}

export type OrchestratorResult =
  | { ok: true; result: OrchestratorSuccessPayload }
  | { ok: false; error: OrchestratorErrorPayload };

export interface OrchestratorDispatchResponse {
  correlationId: string;
  outcome: OrchestratorResult;
}
