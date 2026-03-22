import { Injectable } from '@nestjs/common';
import type {
  OrchestratorCommandEnvelope,
  OrchestratorDispatchResponse,
} from '@wilson/event-contracts';
import type { JsonValue } from '@wilson/shared-types';
import { createLogger } from '@wilson/logger';
import { InMemoryMessageBus } from '../messaging/in-memory.message-bus';
import { OrchestratorApplicationService } from '../orchestration/orchestrator-application.service';

@Injectable()
export class DispatchService {
  private readonly log = createLogger({ name: 'orchestrator-dispatch' });

  constructor(
    private readonly orchestratorApp: OrchestratorApplicationService,
    private readonly bus: InMemoryMessageBus,
  ) {}

  async run(envelope: OrchestratorCommandEnvelope): Promise<OrchestratorDispatchResponse> {
    await this.bus.publish(`orchestrator.command.${envelope.type}`, {
      subject: `orchestrator.command.${envelope.type}`,
      body: { type: envelope.type, payload: envelope.payload },
      context: envelope.context,
    });

    const result = await this.orchestratorApp.execute(envelope);

    await this.bus.publish(`orchestrator.result.${envelope.type}`, {
      subject: `orchestrator.result.${envelope.type}`,
      body: { outcome: result.outcome } as unknown as JsonValue,
      context: envelope.context,
    });

    this.log.info(
      {
        event: 'dispatch_finished',
        correlationId: envelope.context.correlationId,
        tenantId: envelope.context.tenantId,
        commandType: envelope.type,
        ok: result.outcome.ok,
      },
      'dispatch finished',
    );

    return result;
  }
}
