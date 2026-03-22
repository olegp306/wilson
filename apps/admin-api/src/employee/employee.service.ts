import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeRole as PrismaEmployeeRole, EmployeeStatus } from '@prisma/client';
import { employeeId, tenantId } from '@wilson/shared-types';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateEmployeeDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant) throw new BadRequestException('Unknown tenant');
    try {
      const row = await this.prisma.employee.create({
        data: {
          tenantId: dto.tenantId,
          email: dto.email,
          displayName: dto.displayName,
          role: dto.role ?? PrismaEmployeeRole.MEMBER,
        },
      });
      await this.audit.log({
        tenantId: dto.tenantId,
        action: 'EMPLOYEE_CREATED',
        entityType: 'Employee',
        entityId: row.id,
        actorType: 'ADMIN_API',
        payload: { email: row.email, role: row.role },
      });
      return this.map(row);
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code?: string }).code === 'P2002'
      ) {
        throw new ConflictException('Employee email already exists for tenant');
      }
      throw e;
    }
  }

  async listByTenant(tenantIdParam: string) {
    if (!tenantIdParam) throw new BadRequestException('tenantId query required');
    const rows = await this.prisma.employee.findMany({
      where: { tenantId: tenantIdParam },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async getById(id: string) {
    const row = await this.prisma.employee.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Employee not found');
    return this.map(row);
  }

  async getByIdForTenant(tenantIdParam: string, employeeId: string) {
    const row = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId: tenantIdParam },
    });
    if (!row) throw new NotFoundException('Employee not found');
    return this.map(row);
  }

  async assignManager(tenantIdParam: string, employeeId: string, managerId: string | null) {
    const emp = await this.prisma.employee.findFirst({
      where: { id: employeeId, tenantId: tenantIdParam },
    });
    if (!emp) throw new NotFoundException('Employee not found');

    if (managerId) {
      if (managerId === employeeId) {
        throw new BadRequestException('Employee cannot be their own manager');
      }
      const mgr = await this.prisma.employee.findFirst({
        where: { id: managerId, tenantId: tenantIdParam },
      });
      if (!mgr) throw new BadRequestException('Manager must belong to the same tenant');
    }

    await this.prisma.employee.update({
      where: { id: employeeId },
      data: { managerId },
    });

    await this.audit.log({
      tenantId: tenantIdParam,
      action: 'MANAGER_ASSIGNED',
      entityType: 'Employee',
      entityId: employeeId,
      actorType: 'ADMIN_API',
      payload: { managerId },
    });

    return this.getByIdForTenant(tenantIdParam, employeeId);
  }

  private map(row: {
    id: string;
    tenantId: string;
    userId: string | null;
    email: string;
    displayName: string;
    role: PrismaEmployeeRole;
    status: EmployeeStatus;
    managerId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: employeeId(row.id),
      tenantId: tenantId(row.tenantId),
      userId: row.userId,
      email: row.email,
      displayName: row.displayName,
      role: row.role,
      status: row.status,
      managerId: row.managerId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
