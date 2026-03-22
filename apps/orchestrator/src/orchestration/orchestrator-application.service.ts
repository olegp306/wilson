import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  createWorkflowRun,
  finishWorkflowRun,
  writeAuditLog,
} from '@wilson/db';
import {
  AGENT_HTTP_ROUTES,
  capabilityForCommand,
  type OrchestratorCommandEnvelope,
  type OrchestratorDispatchResponse,
} from '@wilson/event-contracts';
import { createLogger } from '@wilson/logger';
import { PrismaService } from '../prisma/prisma.service';
import type { OrchestrationRuntime } from './orchestration-runtime.interface';
import { ORCHESTRATION_RUNTIME } from './tokens';

@Injectable()
export class OrchestratorApplicationService {
  private readonly log = createLogger({ name: 'orchestrator-app' });

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ORCHESTRATION_RUNTIME) private readonly runtime: OrchestrationRuntime,
  ) {}

  async execute(envelope: OrchestratorCommandEnvelope): Promise<OrchestratorDispatchResponse> {
    const correlationId = envelope.context.correlationId;
    const tenantId = envelope.context.tenantId as unknown as string;
    const capability = capabilityForCommand(envelope.type);
    const route = AGENT_HTTP_ROUTES[envelope.type];

    this.log.info(
      {
        event: 'orchestrator_dispatch_start',
        correlationId,
        tenantId,
        commandType: envelope.type,
        capability,
        agentKey: route.agentKey,
      },
      'orchestrator dispatch',
    );

    let workflowId: string | undefined;
    try {
      const wf = await createWorkflowRun(this.prisma, {
        tenantId,
        name: `orchestrator.${envelope.type}`,
        correlationId,
        metadata: { commandType: envelope.type, capability, agentKey: route.agentKey },
      });
      workflowId = wf.id;

      await writeAuditLog(this.prisma, {
        tenantId,
        action: 'ORCHESTRATOR_COMMAND_DISPATCHED',
        entityType: 'WorkflowRun',
        entityId: wf.id,
        correlationId,
        actorType: 'ORCHESTRATOR',
        payload: { commandType: envelope.type, capability, agentKey: route.agentKey },
      });
    } catch (err) {
      this.log.warn(
        {
          event: 'orchestrator_persistence_skipped',
          correlationId,
          err: err instanceof Error ? err.message : String(err),
        },
        'workflow/audit persistence unavailable; continuing with agent dispatch',
      );
    }

    const result = await this.runtime.dispatch(envelope);

    if (!workflowId) {
      return result;
    }

    const finishMeta: Record<string, unknown> = {
      ok: result.outcome.ok,
      commandType: envelope.type,
    };
    if (!result.outcome.ok) {
      finishMeta.error = result.outcome.error;
    }

    try {
      await finishWorkflowRun(this.prisma, {
        id: workflowId,
        status: result.outcome.ok ? 'SUCCEEDED' : 'FAILED',
        metadata: finishMeta,
      });

      await writeAuditLog(this.prisma, {
        tenantId,
        action: result.outcome.ok ? 'WORKFLOW_SUCCEEDED' : 'WORKFLOW_FAILED',
        entityType: 'WorkflowRun',
        entityId: workflowId,
        correlationId,
        actorType: 'ORCHESTRATOR',
        payload: finishMeta as unknown as Prisma.InputJsonValue,
      });
    } catch (err) {
      this.log.warn(
        {
          event: 'orchestrator_finish_persistence_failed',
          correlationId,
          workflowId,
          err: err instanceof Error ? err.message : String(err),
        },
        'failed to finalize workflow record',
      );
    }

    return result;
  }
}
