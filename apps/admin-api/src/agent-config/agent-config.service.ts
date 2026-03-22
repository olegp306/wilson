import { Injectable, NotFoundException } from '@nestjs/common';
import { tenantId } from '@wilson/shared-types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listByTenant(tenantIdParam: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantIdParam } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    const rows = await this.prisma.agentConfig.findMany({
      where: { tenantId: tenantIdParam },
      orderBy: { agentName: 'asc' },
    });
    return rows.map((row) => ({
      tenantId: tenantId(row.tenantId),
      agentName: row.agentName,
      enabled: row.enabled,
      settings: row.settings,
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async setEnabled(tenantIdParam: string, agentName: string, enabled: boolean) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantIdParam } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const row = await this.prisma.agentConfig.upsert({
      where: {
        tenantId_agentName: { tenantId: tenantIdParam, agentName },
      },
      create: {
        tenantId: tenantIdParam,
        agentName,
        enabled,
      },
      update: { enabled },
    });

    await this.audit.log({
      tenantId: tenantIdParam,
      action: 'AGENT_TOGGLED',
      entityType: 'AgentConfig',
      entityId: `${tenantIdParam}:${agentName}`,
      actorType: 'ADMIN_API',
      payload: { agentName, enabled },
    });

    return {
      tenantId: tenantId(row.tenantId),
      agentName: row.agentName,
      enabled: row.enabled,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
