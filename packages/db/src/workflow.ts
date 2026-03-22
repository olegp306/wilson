import type { Prisma, PrismaClient, WorkflowRunStatus } from '@prisma/client';

export async function createWorkflowRun(
  db: PrismaClient,
  params: {
    tenantId: string;
    name: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
  },
) {
  return db.workflowRun.create({
    data: {
      tenantId: params.tenantId,
      name: params.name,
      status: 'RUNNING',
      correlationId: params.correlationId,
      metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function finishWorkflowRun(
  db: PrismaClient,
  params: {
    id: string;
    status: WorkflowRunStatus;
    metadata?: Record<string, unknown>;
  },
) {
  return db.workflowRun.update({
    where: { id: params.id },
    data: {
      status: params.status,
      finishedAt: new Date(),
      ...(params.metadata !== undefined
        ? { metadata: params.metadata as Prisma.InputJsonValue }
        : {}),
    },
  });
}
