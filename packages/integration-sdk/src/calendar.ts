import type { TenantExecutionContext } from './context';

export type CalendarTransportKind =
  | 'google_calendar'
  | 'microsoft_graph_calendar'
  | 'caldav'
  | 'mock';

export interface CalendarDayQuery {
  /** Local calendar date YYYY-MM-DD */
  date: string;
  timeZone?: string;
}

export interface CalendarEventRef {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  organizerEmail?: string;
  providerMetadata?: Record<string, string>;
}

export interface CalendarProvider {
  readonly transportKind: CalendarTransportKind;
  /** Primary Stage 3 target: “today” / day view (maps to Google Calendar `events.list` with timeMin/timeMax). */
  listEventsForDay(
    ctx: TenantExecutionContext,
    query: CalendarDayQuery,
  ): Promise<CalendarEventRef[]>;
  /** Week / arbitrary window; also used for free/busy-style queries later. */
  listEventsForRange(
    ctx: TenantExecutionContext,
    range: { startIso: string; endIso: string },
  ): Promise<CalendarEventRef[]>;
}
