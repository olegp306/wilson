import { describe, expect, it } from 'vitest';
import {
  AGENT_HTTP_ROUTES,
  ORCHESTRATOR_COMMAND_TYPES,
  capabilityForCommand,
} from '@wilson/event-contracts';

describe('capability routing (contracts)', () => {
  it('maps every orchestrator command to a route and capability', () => {
    for (const cmd of ORCHESTRATOR_COMMAND_TYPES) {
      expect(AGENT_HTTP_ROUTES[cmd]).toBeDefined();
      expect(AGENT_HTTP_ROUTES[cmd].path.startsWith('/')).toBe(true);
      expect(capabilityForCommand(cmd)).toMatch(/^wilson\./);
    }
  });

  it('uses stable task and mail routes', () => {
    expect(AGENT_HTTP_ROUTES.GET_MY_TASKS.path).toBe('/tasks/me');
    expect(AGENT_HTTP_ROUTES.CREATE_TASK_FROM_MAIL.path).toBe('/tasks/from-mail');
    expect(AGENT_HTTP_ROUTES.GENERATE_DRAFT_REPLY.path).toBe('/mail/draft-reply');
    expect(AGENT_HTTP_ROUTES.GET_LATEST_EMAILS.path).toBe('/mail/latest');
    expect(AGENT_HTTP_ROUTES.CREATE_CALENDAR_EVENT.path).toBe('/calendar/events');
  });
});
