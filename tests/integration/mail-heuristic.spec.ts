import { describe, expect, it } from 'vitest';
import { heuristicBriefSummary } from '../../apps/mail-agent/src/mail/mail-summarizer';

describe('mail heuristic summary', () => {
  it('returns a friendly empty-folder message', () => {
    expect(heuristicBriefSummary([])).toContain('No recent');
  });

  it('lists subjects and senders', () => {
    const text = heuristicBriefSummary([
      {
        id: '1',
        from: 'a@b.com',
        subject: 'Hello',
        receivedAt: new Date().toISOString(),
        snippet: 'x',
      },
    ]);
    expect(text).toContain('Hello');
    expect(text).toContain('a@b.com');
  });
});
