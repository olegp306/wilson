import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { WILSON_HTTP_HEADERS } from '@wilson/event-contracts';
import { createLogger } from '@wilson/logger';
import { TaskApplicationService } from './task-application.service';

const H = WILSON_HTTP_HEADERS;

@Controller('tasks')
export class TasksController {
  private readonly log = createLogger({ name: 'task-agent' });

  constructor(private readonly app: TaskApplicationService) {}

  @Post('from-mail')
  async createFromMail(
    @Body() body: Record<string, unknown>,
    @Headers(H.correlationId) correlationId: string | undefined,
    @Headers(H.tenantId) tenantIdHeader: string | undefined,
    @Headers(H.employeeId) employeeId: string | undefined,
  ) {
    const ctx = this.app.buildContext({ correlationId, tenantId: tenantIdHeader, employeeId });
    const messageId =
      typeof body.messageId === 'string' && body.messageId.length > 0 ? body.messageId : undefined;
    const titleHint =
      typeof body.titleHint === 'string' && body.titleHint.length > 0 ? body.titleHint : undefined;

    const payload = await this.app.createFromMail(ctx, { messageId, titleHint });

    this.log.info(
      {
        event: 'task_from_mail_stub',
        correlationId,
        tenantId: tenantIdHeader,
        taskId: payload.taskId,
      },
      'stub task created from mail',
    );

    return payload;
  }

  @Get('me')
  async getMine(
    @Headers(H.correlationId) correlationId: string | undefined,
    @Headers(H.tenantId) tenantIdHeader: string | undefined,
    @Headers(H.employeeId) employeeId: string | undefined,
  ) {
    const ctx = this.app.buildContext({ correlationId, tenantId: tenantIdHeader, employeeId });
    const payload = await this.app.listMine(ctx);

    this.log.info(
      {
        event: 'task_list_served',
        correlationId,
        tenantId: tenantIdHeader,
        taskCount: payload.tasks.length,
      },
      'task list returned',
    );

    return payload;
  }
}
