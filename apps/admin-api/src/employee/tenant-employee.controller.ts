import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminApiKeyGuard } from '../auth/admin-api-key.guard';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { EmployeeService } from './employee.service';

@ApiTags('employees')
@ApiSecurity('admin-key')
@UseGuards(AdminApiKeyGuard)
@Controller('tenants/:tenantId/employees')
export class TenantEmployeeController {
  constructor(private readonly employees: EmployeeService) {}

  @Get()
  @ApiOperation({ summary: 'List employees for tenant (tenant-scoped path)' })
  list(@Param('tenantId') tenantId: string) {
    return this.employees.listByTenant(tenantId);
  }

  @Get(':employeeId')
  @ApiOperation({ summary: 'Get employee by id within tenant' })
  get(@Param('tenantId') tenantId: string, @Param('employeeId') employeeId: string) {
    return this.employees.getByIdForTenant(tenantId, employeeId);
  }

  @Patch(':employeeId/manager')
  @ApiOperation({ summary: 'Assign or clear manager for employee' })
  assignManager(
    @Param('tenantId') tenantId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: AssignManagerDto,
  ) {
    const mid = dto.managerId === undefined ? null : dto.managerId;
    return this.employees.assignManager(tenantId, employeeId, mid);
  }
}
