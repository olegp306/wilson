import { describe, expect, it } from 'vitest';
import {
  AGENT_HTTP_ROUTES,
  parseAgentResponseBody,
  taskListResponseSchema,
  validateOrchestratorPayload,
} from './agent-contracts';

describe('agent contracts', () => {
  it('defines a route for every orchestrator command', () => {
    expect(AGENT_HTTP_ROUTES.GET_MY_TASKS.path).toBe('/tasks/me');
    expect(AGENT_HTTP_ROUTES.GENERATE_DRAFT_REPLY.method).toBe('POST');
  });

  it('parses valid task payloads', () => {
    const raw = taskListResponseSchema.parse({
      tasks: [{ id: '1', title: 'T', status: 'open', dueAt: new Date().toISOString() }],
    });
    const r = parseAgentResponseBody('GET_MY_TASKS', raw);
    expect(r.ok).toBe(true);
  });

  it('rejects invalid agent payloads', () => {
    const r = parseAgentResponseBody('GET_MY_TASKS', { tasks: 'nope' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('AGENT_CONTRACT_VIOLATION');
  });

  it('validates orchestrator command payloads', () => {
    expect(validateOrchestratorPayload('GET_MY_TASKS', {}).ok).toBe(true);
    expect(validateOrchestratorPayload('GET_MY_TASKS', { x: 1 }).ok).toBe(false);
    expect(validateOrchestratorPayload('GENERATE_DRAFT_REPLY', { tone: 'casual' }).ok).toBe(true);
  });
});
