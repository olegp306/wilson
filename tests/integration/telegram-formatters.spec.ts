import { describe, expect, it } from 'vitest';
import type { OrchestratorDispatchResponse } from '@wilson/event-contracts';
import { formatOrchestratorReply } from '../../apps/telegram-bot/src/formatters';

describe('telegram formatters (integration-ish)', () => {
  it('formats task payloads', () => {
    const res: OrchestratorDispatchResponse = {
      correlationId: 'c1',
      outcome: {
        ok: true,
        result: {
          agent: 'task-agent',
          data: {
            tasks: [
              {
                id: 't1',
                title: 'Sample task A',
                status: 'open',
                dueAt: new Date().toISOString(),
              },
            ],
          },
        },
      },
    };
    const text = formatOrchestratorReply(res);
    expect(text).toContain('Tasks');
    expect(text).toContain('Sample task A');
  });

  it('formats latest emails', () => {
    const res: OrchestratorDispatchResponse = {
      correlationId: 'c2',
      outcome: {
        ok: true,
        result: {
          agent: 'mail-agent',
          data: {
            emails: [
              {
                id: '1',
                from: 'a@b.com',
                subject: 'Hello',
                receivedAt: new Date().toISOString(),
                bodyPreview: 'Body line one',
                snippet: 'Body line one',
              },
            ],
          },
        },
      },
    };
    expect(formatOrchestratorReply(res)).toContain('Hello');
    expect(formatOrchestratorReply(res)).toContain('Body line one');
  });

  it('formats mail summary with optional digest', () => {
    const res: OrchestratorDispatchResponse = {
      correlationId: 'c3',
      outcome: {
        ok: true,
        result: {
          agent: 'mail-agent',
          data: {
            unreadCount: 2,
            briefSummary: 'Two threads about billing.',
            latest: [
              {
                id: 'm1',
                from: 'x@y.com',
                subject: 'Invoice',
                receivedAt: new Date().toISOString(),
                snippet: 'Please pay',
              },
            ],
          },
        },
      },
    };
    const text = formatOrchestratorReply(res);
    expect(text).toContain('Digest:');
    expect(text).toContain('billing');
  });

  it('formats calendar event creation', () => {
    const res: OrchestratorDispatchResponse = {
      correlationId: 'c4',
      outcome: {
        ok: true,
        result: {
          agent: 'calendar-agent',
          data: {
            eventId: 'evt_1',
            htmlLink: 'https://calendar.google.com/event?eid=abc',
          },
        },
      },
    };
    const text = formatOrchestratorReply(res);
    expect(text).toContain('evt_1');
    expect(text).toContain('https://calendar.google.com');
  });
});
