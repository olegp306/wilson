import { Telegraf, type Context } from 'telegraf';
import type { OrchestratorCommandType } from '@wilson/event-contracts';
import { loadRootEnv } from '@wilson/config';
import { dispatchCommand } from './orchestrator-client';
import { formatOrchestratorReply } from './formatters';
import { auditTelegramCommand } from './telegram-audit';
import { resolveTelegramUser } from './telegram-context';

function unlinkedMessage(telegramUserId: string): string {
  return [
    'Your Telegram account is not linked to Wilson yet.',
    '',
    'Ask an admin to link your Telegram user id to your employee record:',
    '`POST /api/tenants/{tenantId}/telegram-bindings` with `employeeId`, `telegramUserId`, `telegramUsername` (see README).',
    '',
    `Your Telegram user id: \`${telegramUserId}\``,
  ].join('\n');
}

export interface BotEnv {
  token: string;
  orchestratorUrl: string;
  /** Fallback when DB unavailable or unlinked (dev only) */
  fallbackTenantId: string;
  fallbackEmployeeId?: string;
}

export function createBot(env: BotEnv): Telegraf<Context> {
  const bot = new Telegraf<Context>(env.token);

  bot.start(async (ctx) => {
    const uid = String(ctx.from?.id ?? '');
    const resolved = await resolveTelegramUser(uid);
    if (!resolved) {
      await ctx.reply(unlinkedMessage(uid), { parse_mode: 'Markdown' });
      return;
    }
    await ctx.reply(
      [
        `Hello${resolved.displayName ? `, ${resolved.displayName}` : ''}.`,
        'Commands:',
        '/tasks — your tasks',
        '/calendar — today’s calendar',
        '/mail — latest emails (IMAP)',
        '/mail-summary — inbox summary',
        '/draft-reply — draft a reply (does not send)',
        '/newevent — create a placeholder calendar event (safe demo window)',
      ].join('\n'),
    );
  });

  const run = async (
    ctx: Context,
    command: string,
    type: OrchestratorCommandType,
    payload?: Record<string, unknown>,
  ) => {
    const uid = String(ctx.from?.id ?? '');
    const resolved = await resolveTelegramUser(uid);
    const tenantId = resolved?.tenantId ?? env.fallbackTenantId;
    const employeeId = resolved?.employeeId ?? env.fallbackEmployeeId;

    if (!resolved && !env.fallbackEmployeeId) {
      await ctx.reply(unlinkedMessage(uid), { parse_mode: 'Markdown' });
      return;
    }

    await auditTelegramCommand({
      tenantId,
      command,
      employeeId,
    });
    const res = await dispatchCommand({
      orchestratorUrl: env.orchestratorUrl,
      type,
      tenantId,
      employeeId,
      payload,
    });
    await ctx.reply(await formatOrchestratorReply(res));
  };

  bot.command('tasks', async (ctx) => run(ctx, '/tasks', 'GET_MY_TASKS'));
  bot.command('calendar', async (ctx) => run(ctx, '/calendar', 'GET_MY_CALENDAR'));
  bot.command('mail', async (ctx) => run(ctx, '/mail', 'GET_LATEST_EMAILS'));
  bot.command('mail-summary', async (ctx) => run(ctx, '/mail-summary', 'GET_LATEST_MAIL_SUMMARY'));
  bot.command('draft-reply', async (ctx) =>
    run(ctx, '/draft-reply', 'GENERATE_DRAFT_REPLY', { tone: 'professional' }),
  );

  bot.command('newevent', async (ctx) => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(10, 0, 0, 0);
    const end = new Date(start);
    end.setHours(11, 0, 0, 0);
    await ctx.reply(
      [
        'Creating a **demo** calendar event tomorrow 10:00–11:00 (local server time).',
        'Wilson does not send invites to others unless your Google integration is configured.',
      ].join('\n'),
      { parse_mode: 'Markdown' },
    );
    await run(ctx, '/newevent', 'CREATE_CALENDAR_EVENT', {
      title: 'Wilson demo block',
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    });
  });

  return bot;
}

export async function launchPollingBot() {
  loadRootEnv();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is required for live Telegram mode');
  }
  const env: BotEnv = {
    token,
    orchestratorUrl: process.env.ORCHESTRATOR_URL ?? 'http://localhost:3020',
    fallbackTenantId: process.env.WILSON_TENANT_ID ?? '11111111-1111-4111-8111-111111111111',
    fallbackEmployeeId: process.env.WILSON_EMPLOYEE_ID,
  };
  const bot = createBot(env);
  await bot.launch();
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
