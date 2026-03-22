import type { JsonValue } from '@wilson/shared-types';
import type { CorrelationContext } from './metadata';

export interface MessageEnvelope<TBody extends JsonValue = JsonValue> {
  subject: string;
  body: TBody;
  context: CorrelationContext;
  replyTo?: string;
}

export interface MessageBusPublishOptions {
  correlationId?: string;
}

export interface MessageBus {
  publish(subject: string, envelope: MessageEnvelope): Promise<void>;
  subscribe(
    subject: string,
    handler: (envelope: MessageEnvelope) => Promise<void>,
  ): Promise<() => Promise<void>>;
  request?<T extends JsonValue>(
    subject: string,
    envelope: MessageEnvelope,
    timeoutMs?: number,
  ): Promise<MessageEnvelope<T>>;
}
