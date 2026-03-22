import { Injectable, Logger } from '@nestjs/common';
import { IntegrationKind } from '@prisma/client';
import { DevMailProvider, type MailProvider, type TenantExecutionContext } from '@wilson/integration-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { ImapMailProvider } from './imap-mail.provider';
import { parseImapSecret } from './imap-credentials';

const devSingleton = new DevMailProvider();

@Injectable()
export class MailProviderResolverService {
  private readonly log = new Logger(MailProviderResolverService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves the best mail provider: employee-specific IMAP, tenant-wide IMAP, or dev mock.
   */
  async resolve(ctx: TenantExecutionContext): Promise<MailProvider> {
    if (process.env.MAIL_FORCE_MOCK === '1') {
      return devSingleton;
    }
    if (!process.env.DATABASE_URL) {
      return devSingleton;
    }

    try {
      const orFilters: Array<{ employeeId: string } | { employeeId: null }> = [{ employeeId: null }];
      if (ctx.employeeId) {
        orFilters.unshift({ employeeId: ctx.employeeId });
      }

      const rows = await this.prisma.integrationConnection.findMany({
        where: {
          tenantId: ctx.tenantId,
          kind: IntegrationKind.EMAIL,
          isActive: true,
          OR: orFilters,
        },
        orderBy: { updatedAt: 'desc' },
      });

      const preferred =
        rows.find((r) => r.employeeId === ctx.employeeId) ?? rows.find((r) => r.employeeId === null);

      if (!preferred) {
        return devSingleton;
      }

      const p = preferred.provider.toUpperCase();
      if (p.includes('IMAP') || p === 'GENERIC_IMAP') {
        const creds = parseImapSecret(preferred.encryptedSecret);
        return new ImapMailProvider(creds);
      }
    } catch (e) {
      this.log.warn(
        `mail provider resolution failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    return devSingleton;
  }
}
