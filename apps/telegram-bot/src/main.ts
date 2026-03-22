import { loadRootEnv } from '@wilson/config';
import { createLogger } from '@wilson/logger';
import { launchPollingBot } from './bot-app';
import { startDevSimulationServer } from './dev-server';

const log = createLogger({ name: 'telegram-bot' });

async function main() {
  loadRootEnv();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (token) {
    await launchPollingBot();
    log.info({}, 'telegram polling started');
    return;
  }

  log.info(
    {},
    'TELEGRAM_BOT_TOKEN not set — starting dev simulation HTTP server (mock Telegram)',
  );
  await startDevSimulationServer();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
