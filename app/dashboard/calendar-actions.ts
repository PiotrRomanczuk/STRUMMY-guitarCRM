'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGoogleOAuth2Client, stopCalendarWatch } from '@/lib/google';
import { google, calendar_v3 } from 'googleapis';
import { SupabaseClient } from '@supabase/supabase-js';
import { createShadowUser } from './actions';
import { isGuitarLesson } from '@/lib/calendar/calendar-utils';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';

/**
 * Disconnect Google: revoke the OAuth token with Google, stop any active
 * webhook watches, then delete the user_integrations and webhook_subscriptions
 * rows. Each step is best-effort — row deletion always proceeds even if
 * revoking or stopping the channel fails (e.g. already expired).
 */
export async function disconnectGoogle() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Fetch integration to get the access token for revocation
  const { data: integration } = await supabase
    .from('user_integrations')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .single();

  // Step 1: Revoke the token with Google (best-effort)
  if (integration?.access_token) {
    try {
      const oauth2Client = getGoogleOAuth2Client();
      await oauth2Client.revokeToken(integration.access_token);
      logger.info('[disconnectGoogle] Token revoked', { userId: user.id });
    } catch (err) {
      logger.warn('[disconnectGoogle] Token revocation failed (continuing)', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Step 2: Stop any active webhook channels (best-effort)
  const { data: subscriptions } = await supabase
    .from('webhook_subscriptions')
    .select('channel_id, resource_id')
    .eq('user_id', user.id)
    .eq('provider', 'google_calendar');

  for (const sub of subscriptions ?? []) {
    try {
      await stopCalendarWatch(user.id, sub.channel_id, sub.resource_id);
    } catch (err) {
      logger.warn('[disconnectGoogle] Failed to stop watch (continuing)', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Step 3: Delete webhook_subscriptions row
  await supabase
    .from('webhook_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', 'google_calendar');

  // Step 4: Delete user_integrations row
  const { error } = await supabase
    .from('user_integrations')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', 'google');

  if (error) {
    logger.error('[disconnectGoogle] Failed to delete integration:', error);
    return { success: false, error: 'Failed to disconnect Google' };
  }

  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/calendar');
  return { success: true };
}

async function getAuthenticatedCalendarClient(userId: string) {
  const supabase = await createClient();
  const { data: integration, error } = await supabase
    .from('user_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .single();

  if (error || !integration) {
    throw new Error('Google Calendar not connected');
  }

  const oauth2Client = getGoogleOAuth2Client();
  oauth2Client.setCredentials({
    access_token: integration.access_token,
    refresh_token: integration.refresh_token,
    expiry_date: integration.expires_at,
  });

  const now = Date.now();
  if (integration.expires_at && integration.expires_at < now) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await supabase
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
    } catch (refreshError) {
      logger.error('Error refreshing access token:', refreshError);
      throw new Error('Failed to refresh Google access token');
    }
  }

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function getGoogleEvents() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    const calendar = await getAuthenticatedCalendarClient(user.id);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: fourteenDaysAgo.toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return (response.data.items || []).filter(isGuitarLesson);
  } catch (error) {
    if (error instanceof Error && error.message === 'Google Calendar not connected') {
      return null;
    }
    logger.error('Error fetching calendar events:', error);
    throw new Error('Failed to fetch calendar events');
  }
}

export async function getPotentialCustomerEvents() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  try {
    const calendar = await getAuthenticatedCalendarClient(user.id);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: fourteenDaysAgo.toISOString(),
      q: 'Pierwsza lekcja',
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  } catch (error) {
    if (error instanceof Error && error.message === 'Google Calendar not connected') {
      return null;
    }
    logger.error('Error fetching potential customer events:', error);
    throw new Error('Failed to fetch potential customer events');
  }
}

export async function syncLessonsFromCalendar(studentEmail: string, studentId?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  let targetStudentId = studentId;
  if (!targetStudentId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', studentEmail)
      .single();

    if (profile) {
      targetStudentId = profile.id;
    } else {
      // Create shadow user
      const result = await createShadowUser(studentEmail);
      targetStudentId = result.userId;
    }
  }

  const calendar = await getAuthenticatedCalendarClient(user.id);

  const now = new Date();
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);
  const sevenDaysFuture = new Date(now);
  sevenDaysFuture.setDate(now.getDate() + 7);

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: fourteenDaysAgo.toISOString(),
      timeMax: sevenDaysFuture.toISOString(),
      q: studentEmail,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    const supabaseAdmin = createAdminClient();
    let createdCount = 0;

    for (const event of events) {
      const created = await syncSingleEvent(
        supabaseAdmin,
        event,
        user.id,
        targetStudentId!,
        studentEmail
      );
      if (created) createdCount++;
    }

    return { success: true, count: createdCount };
  } catch (error) {
    logger.error('Error syncing lessons:', error);
    throw new Error('Failed to sync lessons');
  }
}

export async function syncAllLessonsFromCalendar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const calendar = await getAuthenticatedCalendarClient(user.id);
  const supabaseAdmin = createAdminClient();

  const now = new Date();
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);
  const sevenDaysFuture = new Date(now);
  sevenDaysFuture.setDate(now.getDate() + 7);

  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: fourteenDaysAgo.toISOString(),
      timeMax: sevenDaysFuture.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = (response.data.items || []).filter(isGuitarLesson);
    let totalSynced = 0;

    for (const event of events) {
      if (!event.start?.dateTime || !event.id) continue;

      // Identify potential students from attendees
      const attendees = event.attendees || [];
      const studentEmails = attendees
        .map((a) => a.email)
        .filter((email) => email && email !== user.email && email.includes('@')) as string[];

      for (const email of studentEmails) {
        try {
          const userResult = await createShadowUser(email);
          const studentId = userResult.userId;

          const created = await syncSingleEvent(supabaseAdmin, event, user.id, studentId, email);

          if (created) totalSynced++;
        } catch (err) {
          logger.error(`Failed to sync event ${event.id} for student ${email}:`, err);
        }
      }
    }

    return { success: true, count: totalSynced };
  } catch (error) {
    logger.error('Error syncing all lessons:', error);
    throw new Error('Failed to sync all lessons');
  }
}

function isEventRelevant(event: calendar_v3.Schema$Event, studentEmail: string): boolean {
  if (!event.start?.dateTime || !event.id) return false;
  if (!isGuitarLesson(event)) return false;

  return !!(
    event.attendees?.some((a) => a.email === studentEmail) ||
    event.summary?.includes(studentEmail) ||
    event.description?.includes(studentEmail)
  );
}

async function updateLesson(
  supabaseAdmin: SupabaseClient,
  lessonId: string,
  event: calendar_v3.Schema$Event
) {
  const { error } = await supabaseAdmin
    .from('lessons')
    .update({
      title: event.summary || 'Lesson',
      scheduled_at: event.start!.dateTime!,
    })
    .eq('id', lessonId);

  if (error) logger.error('Error updating lesson:', error);
}

async function createLesson(
  supabaseAdmin: SupabaseClient,
  event: calendar_v3.Schema$Event,
  teacherId: string,
  studentId: string
): Promise<boolean> {
  const { data: lastLesson } = await supabaseAdmin
    .from('lessons')
    .select('lesson_teacher_number')
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
    .order('lesson_teacher_number', { ascending: false })
    .limit(1)
    .single();

  const nextNumber = (lastLesson?.lesson_teacher_number || 0) + 1;

  const { error } = await supabaseAdmin.from('lessons').insert({
    teacher_id: teacherId,
    student_id: studentId,
    title: event.summary || 'Lesson',
    scheduled_at: event.start!.dateTime!,
    google_event_id: event.id,
    lesson_teacher_number: nextNumber,
  });

  if (error) {
    logger.error('Error inserting lesson:', error);
    return false;
  }
  return true;
}

async function syncSingleEvent(
  supabaseAdmin: SupabaseClient,
  event: calendar_v3.Schema$Event,
  teacherId: string,
  studentId: string,
  studentEmail: string
): Promise<boolean> {
  if (!isEventRelevant(event, studentEmail)) return false;

  const { data: existing } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('google_event_id', event.id!)
    .single();

  if (existing) {
    await updateLesson(supabaseAdmin, existing.id, event);
    return false;
  }

  return await createLesson(supabaseAdmin, event, teacherId, studentId);
}
