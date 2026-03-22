import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { WILSON_HTTP_HEADERS } from '@wilson/event-contracts';
import { createLogger } from '@wilson/logger';
import { MailApplicationService } from './mail-application.service';
import { MailDraftReplyRequestDto } from './dto/mail-draft-reply.dto';

const H = WILSON_HTTP_HEADERS;

@Controller('mail')
export class MailController {
  private readonly log = createLogger({ name: 'mail-agent' });

  constructor(private readonly app: MailApplicationService) {}

  @Get('summary')
  async summary(
    @Headers(H.correlationId) correlationId: string | undefined,
    @Headers(H.tenantId) tenantIdHeader: string | undefined,
    @Headers(H.employeeId) employeeId: string | undefined,
  ) {
    const ctx = this.app.buildContext({ correlationId, tenantId: tenantIdHeader, employeeId });
    const payload = await this.app.getSummary(ctx);

    this.log.info(
      {
        event: 'mail_summary_served',
        correlationId,
        tenantId: tenantIdHeader,
        unreadCount: payload.unreadCount,
      },
      'mail summary returned',
    );

    return payload;
  }

  @Get('latest')
  async latest(
    @Headers(H.correlationId) correlationId: string | undefined,
    @Headers(H.tenantId) tenantIdHeader: string | undefined,
    @Headers(H.employeeId) employeeId: string | undefined,
  ) {
    const ctx = this.app.buildContext({ correlationId, tenantId: tenantIdHeader, employeeId });
    const payload = await this.app.getLatestEmails(ctx);

    this.log.info(
      {
        event: 'mail_latest_served',
        correlationId,
        tenantId: tenantIdHeader,
        count: payload.emails.length,
      },
      'mail latest returned',
    );

    return payload;
  }

  @Post('draft-reply')
  async draftReply(
    @Headers(H.correlationId) correlationId: string | undefined,
    @Headers(H.tenantId) tenantIdHeader: string | undefined,
    @Headers(H.employeeId) employeeId: string | undefined,
    @Body() body: MailDraftReplyRequestDto,
  ) {
    const ctx = this.app.buildContext({ correlationId, tenantId: tenantIdHeader, employeeId });
    const payload = await this.app.draftReply(ctx, {
      messageId: body.messageId,
      tone: body.tone,
    });

    this.log.info(
      {
        event: 'mail_draft_served',
        correlationId,
        tenantId: tenantIdHeader,
        messageId: payload.messageId,
        tone: payload.tone,
      },
      'draft reply returned',
    );

    return payload;
  }
}
