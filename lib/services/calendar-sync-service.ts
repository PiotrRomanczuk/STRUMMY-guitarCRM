/**
 * Calendar Sync Service (Cron-compatible)
 *
 * Syncs Google Calendar events for all teachers with Google OAuth tokens.
 * Uses admin client (no user session) so it can run in cron context.
 * Must run BEFORE student status check to ensure fresh lesson data.
 */

import { google } from 'googleapis';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGoogleOAuth2Client } from '@/lib/google';
import { isGuitarLesson } from '@/lib/calendar/calendar-utils';
import { extractStudentFromAttendees } from '@/lib/services/calendar-bulk-import';
import { findOrCreateAuthUser, upsertStudentProfile } from '@/app/dashboard/actions';
import { logger } from '@/lib/logger';

interface CalendarSyncResult {
  teachersSynced: number;
  lessonsImported: number;
  lessonsSkipped: number;
  errors: Array<{ teacherId: string; error: string }>;
}

/**
 * Sync calendars for all teachers with active Google integration.
 * Fetches events 14 days back + 7 days forward, filters for guitar lessons,
 * deduplicates by google_event_id, and creates lessons + shadow students.
 */
export async function syncAllTeacherCalendars(): Promise<CalendarSyncResult> {
  const admin = createAdminClient();
  const result: CalendarSyncResult = {
    teachersSynced: 0,
    lessonsImported: 0,
    lessonsSkipped: 0,
    errors: [],
  };

  const { data: integrations, error } = await admin
    .from('user_integrations')
    .select('user_id, access_token, refresh_token, expires_at')
    .eq('provider', 'google')
    .not('access_token', 'is', null);

  if (error || !integrations?.length) return result;

  for (const integration of integrations) {
    try {
      const counts = await syncTeacherCalendar(admin, integration);
      result.teachersSynced++;
      result.lessonsImported += counts.imported;
      result.lessonsSkipped += counts.skipped;
    } catch (err) {
      logger.error(`[CalendarSync] Teacher ${integration.user_id} failed:`, err);
      result.errors.push({
        teacherId: integration.user_id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}

async function syncTeacherCalendar(
  admin: ReturnType<typeof createAdminClient>,
  integration: {
    user_id: string;
    access_token: string | null;
    refresh_token: string | null;
    expires_at: number | null;
  }
): Promise<{ imported: number; skipped: number }> {
  const oauth2 = getGoogleOAuth2Client();
  oauth2.setCredentials({
    access_token: integration.access_token,
    refresh_token: integration.refresh_token,
    expiry_date: integration.expires_at,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2 });

  const now = new Date();
  const timeMin = new Date(now);
  timeMin.setDate(timeMin.getDate() - 14);
  const timeMax = new Date(now);
  timeMax.setDate(timeMax.getDate() + 7);

  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = (data.items || []).filter(
    (e) => isGuitarLesson(e) && e.id && e.start?.dateTime
  );

  // Look up teacher email to exclude from attendees
  const { data: teacherProfile } = await admin
    .from('profiles')
    .select('email')
    .eq('user_id', integration.user_id)
    .single();
  const teacherEmail = teacherProfile?.email || '';

  let imported = 0;
  let skipped = 0;

  for (const event of events) {
    const student = extractStudentFromAttendees(
      event.attendees as Array<{ email: string; displayName?: string }> | undefined,
      teacherEmail
    );
    const attendeeEmail = student?.email;
    if (!attendeeEmail) {
      skipped++;
      continue;
    }

    // Deduplicate by google_event_id
    const { data: existing } = await admin
      .from('lessons')
      .select('id')
      .eq('google_event_id', event.id!)
      .single();

    if (existing) {
      skipped++;
      continue;
    }

    try {
      const studentId = await findOrCreateAuthUser(admin, attendeeEmail);
      await upsertStudentProfile(admin, studentId, attendeeEmail);

      const { error: insertError } = await admin.from('lessons').insert({
        student_id: studentId,
        teacher_id: integration.user_id,
        title: event.summary || 'Guitar Lesson',
        notes: event.description || null,
        scheduled_at: event.start!.dateTime!,
        google_event_id: event.id!,
        status: 'SCHEDULED',
      });

      if (insertError) {
        logger.error(`[CalendarSync] Insert failed for event ${event.id}:`, insertError);
        skipped++;
      } else {
        imported++;
      }
    } catch (err) {
      logger.error(`[CalendarSync] Event ${event.id} processing failed:`, err);
      skipped++;
    }
  }

  return { imported, skipped };
}
