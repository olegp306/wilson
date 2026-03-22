import { Injectable, Logger } from '@nestjs/common';
import { IntegrationKind } from '@prisma/client';
import type {
  CalendarDayQuery,
  CalendarEventRef,
  CalendarProvider,
  TenantExecutionContext,
} from '@wilson/integration-sdk';
import { DevCalendarProvider } from '@wilson/integration-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleCalendarClient, parseGoogleCalendarSecret } from './google-calendar.client';

const dev = new DevCalendarProvider();

@Injectable()
export class CalendarIntegrationResolverService {
  private readonly log = new Logger(CalendarIntegrationResolverService.name);

  constructor(private readonly prisma: PrismaService) {}

  async resolveProvider(ctx: {
    tenantId: string;
    employeeId?: string;
  }): Promise<CalendarProvider> {
    if (process.env.CALENDAR_FORCE_MOCK === '1' || !process.env.DATABASE_URL) {
      return dev;
    }
    try {
      const orFilters: Array<{ employeeId: string } | { employeeId: null }> = [{ employeeId: null }];
      if (ctx.employeeId) {
        orFilters.unshift({ employeeId: ctx.employeeId });
      }
      const rows = await this.prisma.integrationConnection.findMany({
        where: {
          tenantId: ctx.tenantId,
          kind: IntegrationKind.CALENDAR,
          isActive: true,
          OR: orFilters,
        },
        orderBy: { updatedAt: 'desc' },
      });
      const row =
        rows.find((r) => r.employeeId === ctx.employeeId) ?? rows.find((r) => r.employeeId === null);
      if (!row) {
        return dev;
      }
      const p = row.provider.toUpperCase();
      if (p.includes('GOOGLE') || p === 'GOOGLE_CALENDAR' || p === 'GOOGLE_WORKSPACE') {
        const secret = parseGoogleCalendarSecret(row.encryptedSecret);
        return new GoogleCalendarAdapter(GoogleCalendarClient.fromSecret(secret));
      }
    } catch (e) {
      this.log.warn(e instanceof Error ? e.message : String(e));
    }
    return dev;
  }

  async resolveGoogleClient(ctx: {
    tenantId: string;
    employeeId?: string;
  }): Promise<GoogleCalendarClient | undefined> {
    if (process.env.CALENDAR_FORCE_MOCK === '1' || !process.env.DATABASE_URL) {
      return undefined;
    }
    try {
      const orFilters: Array<{ employeeId: string } | { employeeId: null }> = [{ employeeId: null }];
      if (ctx.employeeId) {
        orFilters.unshift({ employeeId: ctx.employeeId });
      }
      const rows = await this.prisma.integrationConnection.findMany({
        where: {
          tenantId: ctx.tenantId,
          kind: IntegrationKind.CALENDAR,
          isActive: true,
          OR: orFilters,
        },
        orderBy: { updatedAt: 'desc' },
      });
      const row =
        rows.find((r) => r.employeeId === ctx.employeeId) ?? rows.find((r) => r.employeeId === null);
      if (!row) {
        return undefined;
      }
      const p = row.provider.toUpperCase();
      if (p.includes('GOOGLE') || p === 'GOOGLE_CALENDAR' || p === 'GOOGLE_WORKSPACE') {
        const secret = parseGoogleCalendarSecret(row.encryptedSecret);
        return GoogleCalendarClient.fromSecret(secret);
      }
    } catch (e) {
      this.log.warn(e instanceof Error ? e.message : String(e));
    }
    return undefined;
  }
}

/** Bridges `GoogleCalendarClient` to the integration-sdk `CalendarProvider` port. */
class GoogleCalendarAdapter implements CalendarProvider {
  readonly transportKind = 'google_calendar' as const;

  constructor(private readonly client: GoogleCalendarClient) {}

  async listEventsForDay(
    ctx: TenantExecutionContext,
    query: CalendarDayQuery,
  ): Promise<CalendarEventRef[]> {
    void ctx;
    return this.client.listEventsForLocalDay(query.date, query.timeZone);
  }

  async listEventsForRange(
    ctx: TenantExecutionContext,
    range: { startIso: string; endIso: string },
  ): Promise<CalendarEventRef[]> {
    void ctx;
    const d = range.startIso.slice(0, 10);
    return this.client.listEventsForLocalDay(d);
  }
}
