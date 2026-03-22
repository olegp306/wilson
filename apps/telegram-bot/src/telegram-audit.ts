import { PrismaClient } from '@prisma/client';
import { writeAuditLog } from '@wilson/db';
import { createLogger } from '@wilson/logger';

const log = createLogger({ name: 'telegram-audit' });

let prisma: PrismaClient | null = null;

function getClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function auditTelegramCommand(params: {
  tenantId: string;
  command: string;
  employeeId?: string;
}): Promise<void> {
  const db = getClient();
  if (!db) {
    log.debug({ event: 'telegram_audit_skipped', reason: 'no_database' }, 'audit skipped');
    return;
  }
  try {
    await writeAuditLog(db, {
      tenantId: params.tenantId,
      action: 'TELEGRAM_COMMAND_RECEIVED',
      entityType: 'TelegramCommand',
      actorType: 'TELEGRAM',
      actorId: params.employeeId,
      payload: { command: params.command },
    });
  } catch (err) {
    log.warn(
      { event: 'telegram_audit_failed', err: err instanceof Error ? err.message : String(err) },
      'audit write failed',
    );
  }
}
