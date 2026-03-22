import type { Prisma, PrismaClient } from '@prisma/client';

export interface WriteAuditLogParams {
  tenantId: string;
  action: string;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorType?: string;
  correlationId?: string;
  payload?: Prisma.InputJsonValue;
}

export async function writeAuditLog(db: PrismaClient, params: WriteAuditLogParams) {
  return db.auditLog.create({
    data: {
      tenantId: params.tenantId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      actorId: params.actorId,
      actorType: params.actorType,
      correlationId: params.correlationId,
      payload: params.payload ?? {},
    },
  });
}
