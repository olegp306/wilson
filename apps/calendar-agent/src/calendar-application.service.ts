import { Injectable } from '@nestjs/common';
import {
  createCalendarEventResponseSchema,
  calendarTodayResponseSchema,
  type CreateCalendarEventPayload,
} from '@wilson/event-contracts';
import type { TenantExecutionContext } from '@wilson/integration-sdk';
import { CalendarIntegrationResolverService } from './calendar/calendar-integration-resolver.service';

@Injectable()
export class CalendarApplicationService {
  constructor(private readonly resolver: CalendarIntegrationResolverService) {}

  buildContext(headers: {
    correlationId?: string;
    tenantId?: string;
    employeeId?: string;
  }): TenantExecutionContext {
    return {
      correlationId: headers.correlationId ?? 'unknown',
      tenantId: headers.tenantId ?? 'unknown',
      employeeId: headers.employeeId,
    };
  }

  async getToday(ctx: TenantExecutionContext) {
    const provider = await this.resolver.resolveProvider({
      tenantId: ctx.tenantId,
      employeeId: ctx.employeeId,
    });
    const day = new Date();
    const dateStr = day.toISOString().slice(0, 10);
    let timeZone = 'UTC';
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      /* keep UTC */
    }

    const raw = await provider.listEventsForDay(ctx, { date: dateStr, timeZone });

    return calendarTodayResponseSchema.parse({
      date: dateStr,
      timeZone,
      events: raw.map((e) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        location: e.location,
        organizerEmail: e.organizerEmail,
      })),
    });
  }

  async createEvent(ctx: TenantExecutionContext, payload: CreateCalendarEventPayload) {
    const client = await this.resolver.resolveGoogleClient({
      tenantId: ctx.tenantId,
      employeeId: ctx.employeeId,
    });
    if (client) {
      const r = await client.createEvent({
        title: payload.title,
        startIso: payload.startIso,
        endIso: payload.endIso,
        location: payload.location,
      });
      return createCalendarEventResponseSchema.parse({
        eventId: r.eventId,
        htmlLink: r.htmlLink,
      });
    }

    return createCalendarEventResponseSchema.parse({
      eventId: `mock-${Date.now()}`,
      htmlLink: undefined,
    });
  }
}
