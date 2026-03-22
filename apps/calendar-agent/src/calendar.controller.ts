import { BadRequestException, Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { WILSON_HTTP_HEADERS, createCalendarEventPayloadSchema } from '@wilson/event-contracts';
import { createLogger } from '@wilson/logger';
import { CalendarApplicationService } from './calendar-application.service';

const H = WILSON_HTTP_HEADERS;

@Controller('calendar')
export class CalendarController {
  private readonly log = createLogger({ name: 'calendar-agent' });

  constructor(private readonly app: CalendarApplicationService) {}

  @Get('today')
  async today(
    @Headers(H.correlationId) correlationId: string | undefined,
    @Headers(H.tenantId) tenantIdHeader: string | undefined,
    @Headers(H.employeeId) employeeId: string | undefined,
  ) {
    const ctx = this.app.buildContext({ correlationId, tenantId: tenantIdHeader, employeeId });
    const payload = await this.app.getToday(ctx);

    this.log.info(
      {
        event: 'calendar_today_served',
        correlationId,
        tenantId: tenantIdHeader,
        date: payload.date,
        eventCount: payload.events.length,
      },
      'calendar today returned',
    );

    return payload;
  }

  @Post('events')
  async createEvent(
    @Headers(H.correlationId) correlationId: string | undefined,
    @Headers(H.tenantId) tenantIdHeader: string | undefined,
    @Headers(H.employeeId) employeeId: string | undefined,
    @Body() body: unknown,
  ) {
    const parsed = createCalendarEventPayloadSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const ctx = this.app.buildContext({ correlationId, tenantId: tenantIdHeader, employeeId });
    const payload = await this.app.createEvent(ctx, parsed.data);

    this.log.info(
      {
        event: 'calendar_event_created',
        correlationId,
        tenantId: tenantIdHeader,
        eventId: payload.eventId,
      },
      'calendar event create',
    );

    return payload;
  }
}
