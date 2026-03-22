import type { TenantExecutionContext } from './context';

/** Concrete mail transports Stage 3 will implement (Gmail API vs IMAP differ in IDs and folders). */
export type MailTransportKind = 'gmail_api' | 'imap' | 'microsoft_graph_mail' | 'mock';

export interface MailListQuery {
  limit: number;
  /** IMAP folder (e.g. INBOX); Gmail REST often ignores. */
  folder?: string;
}

export interface MailMessageRef {
  id: string;
  subject: string;
  from: string;
  receivedAt: string;
  snippet: string;
  threadId?: string;
  /** Opaque provider fields (IMAP uid+folder, Gmail historyId, etc.). */
  providerMetadata?: Record<string, string>;
}

export interface MailDraftReplyInput {
  messageId?: string;
  tone?: 'professional' | 'casual' | 'brief';
}

export interface MailDraftReplyResult {
  messageId: string;
  draft: string;
  tone: string;
}

export interface MailProvider {
  readonly transportKind: MailTransportKind;
  listRecentMessages(
    ctx: TenantExecutionContext,
    query: MailListQuery,
  ): Promise<MailMessageRef[]>;
  generateDraftReply(
    ctx: TenantExecutionContext,
    input: MailDraftReplyInput,
  ): Promise<MailDraftReplyResult>;
}
