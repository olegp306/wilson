import type {
  OrchestratorCommandEnvelope,
  OrchestratorDispatchResponse,
} from '@wilson/event-contracts';

export interface OrchestrationRuntime {
  dispatch(command: OrchestratorCommandEnvelope): Promise<OrchestratorDispatchResponse>;
}
