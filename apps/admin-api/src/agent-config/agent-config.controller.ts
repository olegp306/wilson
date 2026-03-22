import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminApiKeyGuard } from '../auth/admin-api-key.guard';
import { UpdateAgentConfigDto } from './dto/update-agent-config.dto';
import { AgentConfigService } from './agent-config.service';

@ApiTags('agent-config')
@ApiSecurity('admin-key')
@UseGuards(AdminApiKeyGuard)
@Controller('tenants/:tenantId/agents')
export class AgentConfigController {
  constructor(private readonly agentConfig: AgentConfigService) {}

  @Get()
  @ApiOperation({ summary: 'List agent configurations for tenant' })
  list(@Param('tenantId') tenantId: string) {
    return this.agentConfig.listByTenant(tenantId);
  }

  @Patch(':agentName')
  @ApiOperation({ summary: 'Enable or disable an agent for a tenant' })
  toggle(
    @Param('tenantId') tenantId: string,
    @Param('agentName') agentName: string,
    @Body() dto: UpdateAgentConfigDto,
  ) {
    return this.agentConfig.setEnabled(tenantId, agentName, dto.enabled);
  }
}
