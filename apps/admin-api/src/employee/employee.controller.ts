import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminApiKeyGuard } from '../auth/admin-api-key.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeService } from './employee.service';

@ApiTags('employees')
@ApiSecurity('admin-key')
@UseGuards(AdminApiKeyGuard)
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employees: EmployeeService) {}

  @Post()
  @ApiOperation({ summary: 'Create employee' })
  create(@Body() dto: CreateEmployeeDto) {
    return this.employees.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List employees for tenant' })
  list(@Query('tenantId') tenantId: string) {
    return this.employees.listByTenant(tenantId);
  }

  @Get(':employeeId')
  @ApiOperation({ summary: 'Get employee by id' })
  get(@Param('employeeId') employeeId: string) {
    return this.employees.getById(employeeId);
  }
}
