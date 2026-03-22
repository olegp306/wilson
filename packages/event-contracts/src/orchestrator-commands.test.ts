import { describe, expect, it } from 'vitest';
import { ORCHESTRATOR_COMMAND_TYPES } from './orchestrator-commands';

describe('orchestrator commands', () => {
  it('exports stable command types', () => {
    expect(ORCHESTRATOR_COMMAND_TYPES).toContain('GET_MY_TASKS');
    expect(ORCHESTRATOR_COMMAND_TYPES).toContain('GET_MY_CALENDAR');
  });
});
