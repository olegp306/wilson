import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminApiKeyGuard } from '../auth/admin-api-key.guard';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { PatchIntegrationDto } from './dto/patch-integration.dto';
import { IntegrationService } from './integration.service';

@ApiTags('integrations')
@ApiSecurity('admin-key')
@UseGuards(AdminApiKeyGuard)
@Controller('tenants/:tenantId/integrations')
export class IntegrationController {
  constructor(private readonly integrations: IntegrationService) {}

  @Post()
  @ApiOperation({ summary: 'Create integration (credentials stored as provided JSON — not encrypted in MVP)' })
  create(@Param('tenantId') tenantId: string, @Body() dto: CreateIntegrationDto) {
    return this.integrations.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List integrations; optional employeeId includes tenant-wide + that employee' })
  list(
    @Param('tenantId') tenantId: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.integrations.listByTenant(tenantId, employeeId);
  }

  @Patch(':integrationId')
  @ApiOperation({ summary: 'Enable or disable integration' })
  patch(
    @Param('tenantId') tenantId: string,
    @Param('integrationId') integrationId: string,
    @Body() dto: PatchIntegrationDto,
  ) {
    return this.integrations.setEnabled(tenantId, integrationId, dto.enabled);
  }
}
