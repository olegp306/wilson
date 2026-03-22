import type { OrchestratorCommandType } from '@wilson/event-contracts';
import express from 'express';
import { loadRootEnv } from '@wilson/config';
import { dispatchCommand } from './orchestrator-client';
import { formatOrchestratorReply } from './formatters';
import { auditTelegramCommand } from './telegram-audit';

export async function startDevSimulationServer() {
  loadRootEnv();
  const port = Number(process.env.TELEGRAM_BOT_DEV_PORT ?? 3030);
  const orchestratorUrl = process.env.ORCHESTRATOR_URL ?? 'http://localhost:3020';
  const tenantId = process.env.WILSON_TENANT_ID ?? '11111111-1111-4111-8111-111111111111';
  const employeeId = process.env.WILSON_EMPLOYEE_ID;

  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'telegram-bot', mode: 'dev-simulation' });
  });

  app.post('/dev/simulate', async (req, res) => {
    const command = String(req.body?.command ?? '');
    const map: Record<string, OrchestratorCommandType> = {
      '/tasks': 'GET_MY_TASKS',
      '/calendar': 'GET_MY_CALENDAR',
      '/mail': 'GET_LATEST_EMAILS',
      '/mail-summary': 'GET_LATEST_MAIL_SUMMARY',
      '/draft-reply': 'GENERATE_DRAFT_REPLY',
    };

    let type: OrchestratorCommandType | undefined = map[command];
    let payload: Record<string, unknown> | undefined;

    if (command === '/newevent') {
      type = 'CREATE_CALENDAR_EVENT';
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(10, 0, 0, 0);
      const end = new Date(start);
      end.setHours(11, 0, 0, 0);
      payload = {
        title: 'Wilson demo block',
        startIso: start.toISOString(),
        endIso: end.toISOString(),
      };
    }

    if (!type) {
      res.status(400).json({ error: 'Unknown command', allowed: [...Object.keys(map), '/newevent'] });
      return;
    }
    await auditTelegramCommand({ tenantId, command, employeeId });
    if (type === 'GENERATE_DRAFT_REPLY' && !payload) {
      payload = { tone: 'professional' };
    }
    const out = await dispatchCommand({
      orchestratorUrl,
      type,
      tenantId,
      employeeId,
      payload,
    });
    const text = formatOrchestratorReply(out);
    res.json({ correlationId: out.correlationId, text, raw: out });
  });

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`telegram-bot dev simulation on http://localhost:${port}`);
      console.log(
        `POST /dev/simulate body: { "command": "/tasks" | "/calendar" | "/mail" | "/mail-summary" | "/draft-reply" | "/newevent" }`,
      );
      resolve();
    });
  });
}
