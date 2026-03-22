import { describe, expect, it } from 'vitest';
import { AGENT_HTTP_ROUTES, ORCHESTRATOR_COMMAND_TYPES } from '@wilson/event-contracts';

/**
 * Ensures every orchestrator command has an agent route (integration wiring sanity check).
 */
describe('admin / integration contract alignment', () => {
  it('defines HTTP routes for all orchestrator commands', () => {
    for (const cmd of ORCHESTRATOR_COMMAND_TYPES) {
      expect(AGENT_HTTP_ROUTES[cmd]).toBeDefined();
      expect(AGENT_HTTP_ROUTES[cmd].baseUrlEnv).toMatch(/_URL$/);
    }
  });
});
