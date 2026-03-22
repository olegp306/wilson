import type { JsonValue } from '@wilson/shared-types';
import type { CorrelationContext } from './metadata';

export const DOMAIN_EVENT_NAMES = [
  'tenant.created',
  'tenant.updated',
  'employee.created',
  'workflow.started',
  'workflow.completed',
  'agent.command.dispatched',
  'agent.command.completed',
] as const;

export type DomainEventName = (typeof DOMAIN_EVENT_NAMES)[number];

export interface DomainEvent<TPayload extends JsonValue = JsonValue> {
  name: DomainEventName;
  version: number;
  occurredAt: string;
  payload: TPayload;
  context: CorrelationContext;
}
