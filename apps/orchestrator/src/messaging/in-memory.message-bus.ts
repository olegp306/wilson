import { Injectable } from '@nestjs/common';
import type { MessageBus, MessageEnvelope } from '@wilson/event-contracts';

type Handler = (envelope: MessageEnvelope) => Promise<void>;

@Injectable()
export class InMemoryMessageBus implements MessageBus {
  private readonly handlers = new Map<string, Set<Handler>>();

  async publish(subject: string, envelope: MessageEnvelope): Promise<void> {
    const subs = this.handlers.get(subject);
    if (!subs) return;
    await Promise.all([...subs].map((h) => h(envelope)));
  }

  async subscribe(subject: string, handler: Handler): Promise<() => Promise<void>> {
    let set = this.handlers.get(subject);
    if (!set) {
      set = new Set();
      this.handlers.set(subject, set);
    }
    set.add(handler);
    return async () => {
      set?.delete(handler);
    };
  }
}
