import axios from 'axios';
import type { OrchestratorCommandType, OrchestratorDispatchResponse } from '@wilson/event-contracts';
import { createLogger } from '@wilson/logger';

const log = createLogger({ name: 'telegram-orchestrator-client' });

export interface DispatchInput {
  orchestratorUrl: string;
  type: OrchestratorCommandType;
  tenantId: string;
  employeeId?: string;
  correlationId?: string;
  payload?: Record<string, unknown>;
}

export async function dispatchCommand(input: DispatchInput): Promise<OrchestratorDispatchResponse> {
  const url = `${input.orchestratorUrl.replace(/\/$/, '')}/api/dispatch`;
  log.info({ event: 'orchestrator_request', url, type: input.type }, 'calling orchestrator');
  const { data } = await axios.post<OrchestratorDispatchResponse>(url, {
    type: input.type,
    tenantId: input.tenantId,
    employeeId: input.employeeId,
    correlationId: input.correlationId,
    payload: input.payload ?? {},
  });
  return data;
}
