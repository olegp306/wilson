import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantStatus } from '@prisma/client';
import { tenantId } from '@wilson/shared-types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateTenantDto) {
    try {
      const row = await this.prisma.tenant.create({
        data: { name: dto.name, slug: dto.slug },
      });
      await this.audit.log({
        tenantId: row.id,
        action: 'TENANT_CREATED',
        entityType: 'Tenant',
        entityId: row.id,
        actorType: 'ADMIN_API',
        payload: { name: row.name, slug: row.slug },
      });
      return this.map(row);
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code?: string }).code === 'P2002'
      ) {
        throw new ConflictException('Tenant slug already exists');
      }
      throw e;
    }
  }

  async list() {
    const rows = await this.prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((r) => this.map(r));
  }

  async getById(id: string) {
    const row = await this.prisma.tenant.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Tenant not found');
    return this.map(row);
  }

  async listManagerRelations(tenantIdParam: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantIdParam } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    const rows = await this.prisma.employee.findMany({
      where: { tenantId: tenantIdParam, managerId: { not: null } },
      select: { id: true, managerId: true },
    });
    return rows.map((r) => ({
      employeeId: r.id,
      managerId: r.managerId as string,
    }));
  }

  private map(row: {
    id: string;
    name: string;
    slug: string;
    status: TenantStatus;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: tenantId(row.id),
      name: row.name,
      slug: row.slug,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
