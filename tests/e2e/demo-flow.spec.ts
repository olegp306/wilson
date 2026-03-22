import { describe, expect, it, vi } from 'vitest';
import {
  capabilityForCommand,
  type OrchestratorDispatchResponse,
} from '@wilson/event-contracts';
import { formatOrchestratorReply } from '../../apps/telegram-bot/src/formatters';

describe('demo flow (telegram → orchestrator contract chain)', () => {
  it('maps orchestrator commands to stable capabilities', () => {
    expect(capabilityForCommand('GET_MY_TASKS')).toBe('wilson.tasks.query.mine');
    expect(capabilityForCommand('GET_LATEST_MAIL_SUMMARY')).toBe('wilson.mail.query.summary');
    expect(capabilityForCommand('GET_LATEST_EMAILS')).toBe('wilson.mail.query.latest');
    expect(capabilityForCommand('CREATE_CALENDAR_EVENT')).toBe('wilson.calendar.action.createEvent');
  });

  it('formats a successful task response like an agent would return', () => {
    const res: OrchestratorDispatchResponse = {
      correlationId: 'corr-demo',
      outcome: {
        ok: true,
        result: {
          agent: 'task-agent',
          data: {
            tasks: [
              {
                id: 't1',
                title: 'Demo',
                status: 'open',
                dueAt: new Date().toISOString(),
              },
            ],
          },
        },
      },
    };
    expect(formatOrchestratorReply(res)).toContain('Demo');
  });

  it('simulates POST /api/dispatch without a running server', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () =>
        ({
          correlationId: 'remote',
          outcome: {
            ok: true,
            result: { agent: 'task-agent', data: { tasks: [] } },
          },
        }) satisfies OrchestratorDispatchResponse,
    });
    vi.stubGlobal('fetch', fetchMock);

    const orchestratorUrl = 'http://localhost:3020';
    const tenantId = '11111111-1111-4111-8111-111111111111';
    await fetch(`${orchestratorUrl.replace(/\/$/, '')}/api/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'GET_MY_TASKS', tenantId }),
    });

    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(String(init?.body)).type).toBe('GET_MY_TASKS');
    vi.unstubAllGlobals();
  });
});
