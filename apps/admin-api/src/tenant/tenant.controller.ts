import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminApiKeyGuard } from '../auth/admin-api-key.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantService } from './tenant.service';

@ApiTags('tenants')
@ApiSecurity('admin-key')
@UseGuards(AdminApiKeyGuard)
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenants: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Create tenant' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenants.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tenants' })
  list() {
    return this.tenants.list();
  }

  @Get(':tenantId/manager-relations')
  @ApiOperation({ summary: 'List manager–direct report pairs for tenant' })
  listManagerRelations(@Param('tenantId') tenantId: string) {
    return this.tenants.listManagerRelations(tenantId);
  }

  @Get(':tenantId')
  @ApiOperation({ summary: 'Get tenant by id' })
  get(@Param('tenantId') tenantId: string) {
    return this.tenants.getById(tenantId);
  }
}
