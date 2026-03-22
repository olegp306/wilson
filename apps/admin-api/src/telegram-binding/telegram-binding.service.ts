import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import type { LinkTelegramDto } from './dto/link-telegram.dto';

@Injectable()
export class TelegramBindingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async link(tenantId: string, dto: LinkTelegramDto) {
    const emp = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, tenantId },
    });
    if (!emp) throw new NotFoundException('Employee not found in tenant');

    try {
      const row = await this.prisma.telegramBinding.upsert({
        where: { employeeId: dto.employeeId },
        create: {
          tenantId,
          employeeId: dto.employeeId,
          telegramUserId: dto.telegramUserId,
          telegramUsername: dto.telegramUsername ?? null,
        },
        update: {
          telegramUserId: dto.telegramUserId,
          telegramUsername: dto.telegramUsername ?? null,
        },
      });

      await this.audit.log({
        tenantId,
        action: 'TELEGRAM_BINDING_UPSERTED',
        entityType: 'TelegramBinding',
        entityId: row.id,
        actorType: 'ADMIN_API',
        payload: { employeeId: dto.employeeId, telegramUserId: dto.telegramUserId },
      });

      return {
        id: row.id,
        tenantId: row.tenantId,
        employeeId: row.employeeId,
        telegramUserId: row.telegramUserId,
        telegramUsername: row.telegramUsername,
        updatedAt: row.updatedAt.toISOString(),
      };
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        (e as { code?: string }).code === 'P2002'
      ) {
        throw new ConflictException(
          'This Telegram user id is already linked to another employee',
        );
      }
      throw e;
    }
  }
}
