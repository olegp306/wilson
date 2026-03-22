import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export interface ResolvedWilsonContext {
  tenantId: string;
  employeeId: string;
  displayName?: string;
}

export async function resolveTelegramUser(
  telegramUserId: string,
): Promise<ResolvedWilsonContext | null> {
  const db = getPrisma();
  if (!db) {
    return null;
  }
  const binding = await db.telegramBinding.findUnique({
    where: { telegramUserId },
    include: { employee: true },
  });
  if (!binding) {
    return null;
  }
  return {
    tenantId: binding.tenantId,
    employeeId: binding.employeeId,
    displayName: binding.employee.displayName,
  };
}
