import { Inject, Injectable } from '@nestjs/common';
import {
  WILSON_INJECTION,
  type CreateTaskFromMailInput,
  type TaskProvider,
  type TenantExecutionContext,
} from '@wilson/integration-sdk';
import {
  createTaskFromMailResponseSchema,
  taskListResponseSchema,
} from '@wilson/event-contracts';

const CONTRACT_STATUSES = new Set([
  'open',
  'in_progress',
  'blocked',
  'done',
  'cancelled',
]);

@Injectable()
export class TaskApplicationService {
  constructor(@Inject(WILSON_INJECTION.TASK_PROVIDER) private readonly tasks: TaskProvider) {}

  buildContext(headers: {
    correlationId?: string;
    tenantId?: string;
    employeeId?: string;
  }): TenantExecutionContext {
    return {
      correlationId: headers.correlationId ?? 'unknown',
      tenantId: headers.tenantId ?? 'unknown',
      employeeId: headers.employeeId,
    };
  }

  async listMine(ctx: TenantExecutionContext) {
    const rows = await this.tasks.listMyTasks(ctx);
    return taskListResponseSchema.parse({
      tasks: rows.map((t) => ({
        id: t.id,
        title: t.title,
        status: CONTRACT_STATUSES.has(t.status) ? t.status : 'open',
        dueAt: t.dueAt,
      })),
    });
  }

  async createFromMail(ctx: TenantExecutionContext, input: CreateTaskFromMailInput) {
    const result = await this.tasks.createTaskFromMail(ctx, input);
    return createTaskFromMailResponseSchema.parse({
      taskId: result.taskId,
      title: result.title,
      created: result.created,
      sourceMessageId: result.sourceMessageId,
    });
  }
}
