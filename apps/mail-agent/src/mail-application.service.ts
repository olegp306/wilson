import { Injectable } from '@nestjs/common';
import type { MailDraftReplyInput, TenantExecutionContext } from '@wilson/integration-sdk';
import {
  mailDraftReplyResponseSchema,
  mailLatestEmailsResponseSchema,
  mailSummaryResponseSchema,
} from '@wilson/event-contracts';
import { MailProviderResolverService } from './mail/mail-provider-resolver.service';
import { heuristicBriefSummary, maybeLlmBriefSummary, maybeLlmDraftReply } from './mail/mail-summarizer';

@Injectable()
export class MailApplicationService {
  constructor(private readonly resolver: MailProviderResolverService) {}

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

  async getSummary(ctx: TenantExecutionContext) {
    const provider = await this.resolver.resolve(ctx);
    const latest = await provider.listRecentMessages(ctx, { limit: 10 });
    const unreadCount = latest.length;
    const briefHeuristic = heuristicBriefSummary(latest);
    const briefLlm = await maybeLlmBriefSummary(latest, process.env.OPENAI_API_KEY);
    return mailSummaryResponseSchema.parse({
      unreadCount,
      latest: latest.map((m) => ({
        id: m.id,
        from: m.from,
        subject: m.subject,
        receivedAt: m.receivedAt,
        snippet: m.snippet,
        threadId: m.threadId,
      })),
      briefSummary: briefLlm ?? briefHeuristic,
    });
  }

  async getLatestEmails(ctx: TenantExecutionContext) {
    const provider = await this.resolver.resolve(ctx);
    const rows = await provider.listRecentMessages(ctx, { limit: 20 });
    return mailLatestEmailsResponseSchema.parse({
      emails: rows.map((m) => ({
        id: m.id,
        from: m.from,
        subject: m.subject,
        receivedAt: m.receivedAt,
        bodyPreview: m.snippet.slice(0, 2000),
        snippet: m.snippet,
      })),
    });
  }

  async draftReply(ctx: TenantExecutionContext, body: MailDraftReplyInput) {
    const provider = await this.resolver.resolve(ctx);
    const tone = body.tone ?? 'professional';

    const recent = await provider.listRecentMessages(ctx, { limit: 5 });
    const target =
      body.messageId != null
        ? recent.find((m) => m.id === body.messageId) ?? recent[0]
        : recent[0];
    const subject = target?.subject ?? '(no subject)';
    const preview = target?.snippet ?? '';

    const llm = await maybeLlmDraftReply(subject, preview, tone, process.env.OPENAI_API_KEY);
    if (llm) {
      return mailDraftReplyResponseSchema.parse({
        messageId: target?.id ?? 'n/a',
        draft: llm,
        tone,
      });
    }

    const result = await provider.generateDraftReply(ctx, { ...body, tone });
    return mailDraftReplyResponseSchema.parse({
      messageId: result.messageId,
      draft: result.draft,
      tone: result.tone,
    });
  }
}
