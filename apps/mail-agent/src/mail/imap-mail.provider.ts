import type {
  MailDraftReplyInput,
  MailDraftReplyResult,
  MailListQuery,
  MailMessageRef,
  MailProvider,
} from '@wilson/integration-sdk';
import type { TenantExecutionContext } from '@wilson/integration-sdk';
import { simpleParser } from 'mailparser';
import type { ImapConnectionJson } from './imap-credentials';

/**
 * On-demand IMAP fetch (no background sync). Uses imapflow.
 */
export class ImapMailProvider implements MailProvider {
  readonly transportKind = 'imap' as const;

  constructor(private readonly creds: ImapConnectionJson) {}

  async listRecentMessages(
    _ctx: TenantExecutionContext,
    query: MailListQuery,
  ): Promise<MailMessageRef[]> {
    void _ctx;
    const { ImapFlow } = await import('imapflow');
    const client = new ImapFlow({
      host: this.creds.host,
      port: this.creds.port,
      secure: this.creds.secure !== false,
      auth: { user: this.creds.user, pass: this.creds.password },
      logger: false,
    });

    const folder = query.folder ?? 'INBOX';
    const limit = Math.min(Math.max(query.limit, 1), 50);

    await client.connect();
    try {
      const lock = await client.getMailboxLock(folder);
      try {
        const searchResult = await client.search({ all: true });
        const uidList = Array.isArray(searchResult) ? searchResult : [];
        const uids = uidList.slice(-limit);
        const out: MailMessageRef[] = [];
        for (const uid of uids) {
          const message = await client.fetchOne(uid, { source: true }, { uid: true });
          if (
            !message ||
            typeof message !== 'object' ||
            !('source' in message) ||
            !message.source
          ) {
            continue;
          }
          const parsed = await simpleParser(message.source);
          const from =
            parsed.from?.value
              ?.map((a: { address?: string; name?: string }) => a.address || a.name)
              .join(', ') || '(unknown)';
          const subject = parsed.subject || '(no subject)';
          const receivedAt = (parsed.date ?? new Date()).toISOString();
          const text = parsed.text || '';
          const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 220);
          out.push({
            id: String(uid),
            from,
            subject,
            receivedAt,
            snippet: snippet || '(empty body)',
            threadId: parsed.messageId || undefined,
            providerMetadata: { folder, uid: String(uid) },
          });
        }
        return out;
      } finally {
        lock.release();
      }
    } finally {
      await client.logout();
    }
  }

  async generateDraftReply(
    _ctx: TenantExecutionContext,
    input: MailDraftReplyInput,
  ): Promise<MailDraftReplyResult> {
    void _ctx;
    const tone = input.tone ?? 'professional';
    const messageId = input.messageId ?? 'latest';
    return {
      messageId,
      draft: templateDraft(tone, messageId),
      tone,
    };
  }
}

function templateDraft(tone: string, ref: string): string {
  const base = `Thank you for your message (ref: ${ref}). I'll review and follow up shortly.`;
  if (tone === 'casual') return `Hey — thanks for the note (${ref}). I'll get back to you soon.`;
  if (tone === 'brief') return `Ack — noted (${ref}). Following up.`;
  return base;
}
