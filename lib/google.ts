import { google } from 'googleapis';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';
import { withRetry, AI_PROVIDER_RETRY_CONFIG } from '@/lib/ai/retry';
import { logger } from '@/lib/logger';

export const getGoogleOAuth2Client = (redirectUri?: string) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const uri = redirectUri || process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !uri) {
    throw new Error('Missing Google OAuth2 credentials');
  }

  return new google.auth.OAuth2(clientId, clientSecret, uri);
};

export const getGoogleAuthUrl = (redirectUri?: string) => {
  const oauth2Client = getGoogleOAuth2Client(redirectUri);

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/drive.file',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
};

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: Array<{ email: string; displayName?: string }>;
}

export const getGoogleClient = async (userId: string) => {
  const supabase = await createClient();
  const { data: integration, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (error || !integration) {
    throw new Error('Google integration not found');
  }

  const oauth2Client = getGoogleOAuth2Client();

  oauth2Client.setCredentials({
    access_token: integration.access_token,
    refresh_token: integration.refresh_token,
    expiry_date: integration.expires_at,
  });

  return oauth2Client;
};

export async function getCalendarEventsInRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const client = await getGoogleClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: client });

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (response.data.items || []) as CalendarEvent[];
}

/**
 * Admin-capable Google client for server-side/webhook contexts (no user session).
 * Reads tokens via service-role client, handles token refresh with persistence.
 */
export async function getGoogleClientAdmin(userId: string) {
  const admin = createAdminClient();
  const { data: integration, error } = await admin
    .from('user_integrations')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (error || !integration) {
    throw new Error('Google integration not found');
  }

  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.access_token,
    refresh_token: integration.refresh_token,
    expiry_date: integration.expires_at,
  });

  // Check token expiry and refresh if needed
  const now = Date.now();
  if (integration.expires_at && integration.expires_at < now) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await admin
        .from('user_integrations')
        .update({
          access_token: credentials.access_token,
          expires_at: credentials.expiry_date,
          updated_at: new Date().toISOString(),
          ...(credentials.refresh_token && { refresh_token: credentials.refresh_token }),
        })
        .eq('user_id', userId)
        .eq('provider', 'google');
      oauth2Client.setCredentials(credentials);
      logger.info('[GoogleClient] Refreshed expired token for user', { userId });
    } catch (refreshError) {
      logger.error('[GoogleClient] Token refresh failed:', refreshError);
      throw new Error('Failed to refresh Google access token');
    }
  }

  return oauth2Client;
}

/**
 * Fetch calendar events using admin client (for webhook/cron contexts).
 */
export async function getCalendarEventsInRangeAdmin(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const client = await getGoogleClientAdmin(userId);
  const calendar = google.calendar({ version: 'v3', auth: client });

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (response.data.items || []) as CalendarEvent[];
}

export async function watchCalendar(userId: string, webhookUrl: string) {
  const client = await getGoogleClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: client });

  const channelId = crypto.randomUUID();

  const webhookSecret = process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET;

  const response = await calendar.events.watch({
    calendarId: 'primary',
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: webhookUrl,
      ...(webhookSecret && { token: webhookSecret }),
    },
  });

  return {
    channelId: response.data.id,
    resourceId: response.data.resourceId,
    expiration: response.data.expiration ? parseInt(response.data.expiration) : undefined,
  };
}

export async function stopCalendarWatch(
  userId: string,
  channelId: string,
  resourceId: string
): Promise<void> {
  const client = await getGoogleClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: client });

  await withRetry(async () => {
    await calendar.channels.stop({
      requestBody: {
        id: channelId,
        resourceId: resourceId,
      },
    });
  }, AI_PROVIDER_RETRY_CONFIG);
}

/**
 * Create a new Google Calendar event from a lesson
 */
export async function createGoogleCalendarEvent(
  userId: string,
  lesson: {
    title: string;
    scheduled_at: string;
    notes?: string;
    student_email: string;
    duration_minutes?: number;
  }
): Promise<{ eventId: string }> {
  const client = await getGoogleClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: client });

  const startTime = new Date(lesson.scheduled_at);
  const endTime = new Date(startTime.getTime() + (lesson.duration_minutes || 60) * 60 * 1000);

  const event = await withRetry(async () => {
    return calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: lesson.title,
        description: lesson.notes,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: [{ email: lesson.student_email }],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      },
    });
  }, AI_PROVIDER_RETRY_CONFIG);

  if (!event.data.id) {
    throw new Error('Failed to create Google Calendar event: No event ID returned');
  }

  return { eventId: event.data.id };
}

/**
 * Update an existing Google Calendar event
 */
export async function updateGoogleCalendarEvent(
  userId: string,
  googleEventId: string,
  updates: {
    title?: string;
    scheduled_at?: string;
    notes?: string;
    duration_minutes?: number;
  }
): Promise<void> {
  const client = await getGoogleClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: client });

  const requestBody: Record<string, unknown> = {};

  if (updates.title !== undefined) {
    requestBody.summary = updates.title;
  }

  if (updates.notes !== undefined) {
    requestBody.description = updates.notes;
  }

  if (updates.scheduled_at !== undefined) {
    const startTime = new Date(updates.scheduled_at);
    const endTime = new Date(
      startTime.getTime() + (updates.duration_minutes || 60) * 60 * 1000
    );

    requestBody.start = {
      dateTime: startTime.toISOString(),
      timeZone: 'UTC',
    };
    requestBody.end = {
      dateTime: endTime.toISOString(),
      timeZone: 'UTC',
    };
  }

  await withRetry(async () => {
    await calendar.events.patch({
      calendarId: 'primary',
      eventId: googleEventId,
      requestBody,
    });
  }, AI_PROVIDER_RETRY_CONFIG);
}

/**
 * Delete a Google Calendar event
 */
export async function deleteGoogleCalendarEvent(
  userId: string,
  googleEventId: string
): Promise<void> {
  const client = await getGoogleClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: client });

  await withRetry(
    async () => {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId,
      });
    },
    {
      ...AI_PROVIDER_RETRY_CONFIG,
      retryableErrors: [
        ...(AI_PROVIDER_RETRY_CONFIG.retryableErrors || []),
        '410', // Gone - event already deleted
        '404', // Not found - event doesn't exist
      ],
    }
  );
}
