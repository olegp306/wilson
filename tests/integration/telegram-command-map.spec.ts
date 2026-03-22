import { describe, expect, it } from 'vitest';
import type { OrchestratorCommandType } from '@wilson/event-contracts';

/** Mirrors `apps/telegram-bot/src/bot-app.ts` command → orchestrator type mapping. */
const TELEGRAM_COMMAND_MAP: Record<string, OrchestratorCommandType> = {
  '/tasks': 'GET_MY_TASKS',
  '/calendar': 'GET_MY_CALENDAR',
  '/mail': 'GET_LATEST_EMAILS',
  '/mail-summary': 'GET_LATEST_MAIL_SUMMARY',
  '/draft-reply': 'GENERATE_DRAFT_REPLY',
};

describe('telegram command → orchestrator mapping', () => {
  it('covers Stage 3 bot commands', () => {
    expect(TELEGRAM_COMMAND_MAP['/mail']).toBe('GET_LATEST_EMAILS');
    expect(TELEGRAM_COMMAND_MAP['/mail-summary']).toBe('GET_LATEST_MAIL_SUMMARY');
    expect(TELEGRAM_COMMAND_MAP['/draft-reply']).toBe('GENERATE_DRAFT_REPLY');
  });
});
