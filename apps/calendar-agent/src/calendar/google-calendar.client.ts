import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import type { calendar_v3 } from 'googleapis';

export interface GoogleOAuthSecret {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  /** Defaults to primary */
  calendarId?: string;
}

export function parseGoogleCalendarSecret(raw: string): GoogleOAuthSecret {
  const o = JSON.parse(raw) as GoogleOAuthSecret;
  if (!o.clientId || !o.clientSecret || !o.refreshToken) {
    throw new Error('Google Calendar secret JSON must include clientId, clientSecret, refreshToken');
  }
  return o;
}

export class GoogleCalendarClient {
  private readonly calendarId: string;

  constructor(
    private readonly auth: OAuth2Client,
    calendarId?: string,
  ) {
    this.calendarId = calendarId ?? 'primary';
  }

  static fromSecret(secret: GoogleOAuthSecret): GoogleCalendarClient {
    const oauth = new OAuth2Client(secret.clientId, secret.clientSecret);
    oauth.setCredentials({ refresh_token: secret.refreshToken });
    return new GoogleCalendarClient(oauth, secret.calendarId);
  }

  async listEventsForLocalDay(dateYmd: string, timeZone?: string) {
    const cal = google.calendar({ version: 'v3', auth: this.auth });
    const start = new Date(`${dateYmd}T00:00:00`);
    const end = new Date(`${dateYmd}T23:59:59.999`);
    const res = await cal.events.list({
      calendarId: this.calendarId,
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      timeZone: timeZone || undefined,
    });
    const items = res.data.items ?? [];
    return items.map((ev: calendar_v3.Schema$Event) => ({
      id: ev.id ?? 'evt-unknown',
      title: ev.summary ?? '(no title)',
      start: ev.start?.dateTime ?? `${ev.start?.date}T00:00:00.000Z`,
      end: ev.end?.dateTime ?? `${ev.end?.date}T23:59:59.000Z`,
      location: ev.location ?? undefined,
      organizerEmail: ev.organizer?.email ?? undefined,
    }));
  }

  async createEvent(input: {
    title: string;
    startIso: string;
    endIso: string;
    location?: string;
  }) {
    const cal = google.calendar({ version: 'v3', auth: this.auth });
    const created = await cal.events.insert({
      calendarId: this.calendarId,
      requestBody: {
        summary: input.title,
        location: input.location,
        start: { dateTime: input.startIso },
        end: { dateTime: input.endIso },
      },
    });
    return {
      eventId: created.data.id ?? 'unknown',
      htmlLink: created.data.htmlLink ?? undefined,
    };
  }
}
