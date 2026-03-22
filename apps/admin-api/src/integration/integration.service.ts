import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { tenantId } from '@wilson/shared-types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateIntegrationDto } from './dto/create-integration.dto';

@Injectable()
export class IntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(tenantIdParam: string, dto: CreateIntegrationDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantIdParam } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (dto.employeeId) {
      const emp = await this.prisma.employee.findFirst({
        where: { id: dto.employeeId, tenantId: tenantIdParam },
      });
      if (!emp) throw new NotFoundException('Employee not found in tenant');
    }

    const metadata = (dto.metadata ?? {}) as Prisma.InputJsonValue;

    const row = await this.prisma.integrationConnection.create({
      data: {
        tenantId: tenantIdParam,
        employeeId: dto.employeeId ?? null,
        kind: dto.kind,
        provider: dto.provider,
        displayName: dto.displayName,
        encryptedSecret: dto.encryptedSecret,
        metadata,
        isActive: dto.isActive ?? true,
      },
    });

    await this.audit.log({
      tenantId: tenantIdParam,
      action: 'INTEGRATION_CONNECTION_CREATED',
      entityType: 'IntegrationConnection',
      entityId: row.id,
      actorType: 'ADMIN_API',
      payload: { provider: row.provider, kind: row.kind, displayName: row.displayName },
    });

    return this.mapPublic(row);
  }

  async listByTenant(tenantIdParam: string, employeeId?: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantIdParam } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    const rows = await this.prisma.integrationConnection.findMany({
      where: {
        tenantId: tenantIdParam,
        ...(employeeId ? { OR: [{ employeeId }, { employeeId: null }] } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.mapPublic(r));
  }

  async setEnabled(tenantIdParam: string, integrationId: string, enabled: boolean) {
    const row = await this.prisma.integrationConnection.findFirst({
      where: { id: integrationId, tenantId: tenantIdParam },
    });
    if (!row) throw new NotFoundException('Integration not found');

    const updated = await this.prisma.integrationConnection.update({
      where: { id: integrationId },
      data: { isActive: enabled },
    });

    await this.audit.log({
      tenantId: tenantIdParam,
      action: 'INTEGRATION_TOGGLED',
      entityType: 'IntegrationConnection',
      entityId: integrationId,
      actorType: 'ADMIN_API',
      payload: { enabled },
    });

    return this.mapPublic(updated);
  }

  private mapPublic(row: {
    id: string;
    tenantId: string;
    employeeId: string | null;
    kind: string;
    provider: string;
    displayName: string;
    encryptedSecret: string;
    metadata: Prisma.JsonValue;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      tenantId: tenantId(row.tenantId),
      employeeId: row.employeeId,
      kind: row.kind,
      provider: row.provider,
      displayName: row.displayName,
      hasSecret: row.encryptedSecret.length > 0,
      metadata: row.metadata,
      isActive: row.isActive,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
