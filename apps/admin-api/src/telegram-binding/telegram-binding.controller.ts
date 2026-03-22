import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminApiKeyGuard } from '../auth/admin-api-key.guard';
import { LinkTelegramDto } from './dto/link-telegram.dto';
import { TelegramBindingService } from './telegram-binding.service';

@ApiTags('telegram-bindings')
@ApiSecurity('admin-key')
@UseGuards(AdminApiKeyGuard)
@Controller('tenants/:tenantId/telegram-bindings')
export class TelegramBindingController {
  constructor(private readonly bindings: TelegramBindingService) {}

  @Post()
  @ApiOperation({ summary: 'Link Telegram user id to an employee (one Telegram account per employee)' })
  link(@Param('tenantId') tenantId: string, @Body() dto: LinkTelegramDto) {
    return this.bindings.link(tenantId, dto);
  }
}
