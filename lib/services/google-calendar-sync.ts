import { createAdminClient } from '@/lib/supabase/admin';
import { matchStudentByEmail, createShadowStudent } from '@/lib/services/import-utils';
import { resolveStudentAttendee } from '@/lib/services/calendar-bulk-import';
import { TablesInsert } from '@/types/database.types';
import { getCalendarEventsInRangeAdmin } from '@/lib/google';
import { isGuitarLesson } from '@/lib/calendar/calendar-utils';
import { logger } from '@/lib/logger';

const LOOKBACK_DAYS = 7;
const LOOKAHEAD_DAYS = 30;

export interface ImportEvent {
  googleEventId: string;
  title: string;
  notes?: string;
  startTime: string;
  attendeeEmail: string;
  attendeeName?: string;
  manualStudentId?: string; // For manual override
}

/**
 * Sync Google Calendar events into lessons using admin client.
 * Used by webhook handler — no user session available.
 */
export async function syncGoogleEventsForUser(userId: string, events: ImportEvent[]) {
  const supabase = createAdminClient();
  const results = [];

  for (const event of events) {
    let studentId = event.manualStudentId;

    // If no manual override, try to match or create (pass admin client to bypass RLS)
    if (!studentId) {
      const match = await matchStudentByEmail(event.attendeeEmail, supabase);

      if (match.status === 'MATCHED') {
        studentId = match.candidates[0].id.toString();
      } else if (match.status === 'NONE' && event.attendeeName) {
        // Create shadow student
        const [firstName, ...lastNameParts] = event.attendeeName.split(' ');
        const lastName = lastNameParts.join(' ') || '';

        const createResult = await createShadowStudent(
          event.attendeeEmail,
          firstName,
          lastName,
          supabase
        );

        if (!createResult.success) {
          logger.warn('[WebhookSync] Shadow student creation failed', {
            eventId: event.googleEventId,
            email: event.attendeeEmail,
            error: createResult.error,
          });
          results.push({ eventId: event.googleEventId, success: false, error: createResult.error });
          continue;
        }

        studentId = createResult.profileId!;
      } else {
        logger.info('[WebhookSync] Skipped event — ambiguous student match', {
          eventId: event.googleEventId,
          email: event.attendeeEmail,
        });
        results.push({
          eventId: event.googleEventId,
          success: false,
          error: 'Student match ambiguous or required',
        });
        continue;
      }
    }

    // Check for duplicate
    const { data: existing } = await supabase
      .from('lessons')
      .select('id')
      .eq('google_event_id', event.googleEventId)
      .single();

    if (existing) {
      results.push({ eventId: event.googleEventId, success: false, error: 'Already imported' });
      continue;
    }

    // Insert lesson
    const lessonData: TablesInsert<'lessons'> = {
      student_id: studentId,
      teacher_id: userId,
      title: event.title || 'Lesson',
      notes: event.notes,
      scheduled_at: event.startTime,
      google_event_id: event.googleEventId,
      status: 'SCHEDULED',
    };

    const { error } = await supabase.from('lessons').insert(lessonData);

    if (error) {
      logger.error('[WebhookSync] Lesson insert failed', {
        eventId: event.googleEventId,
        error: error.message,
      });
      results.push({ eventId: event.googleEventId, success: false, error: error.message });
    } else {
      logger.info('[WebhookSync] Lesson imported', {
        eventId: event.googleEventId,
        studentId,
      });
      results.push({ eventId: event.googleEventId, success: true });
    }
  }

  return { success: true, results };
}

/**
 * Fetch recent Google Calendar events and sync them as lessons.
 * Uses admin client throughout — called from webhook handler (no user session).
 * Includes a 7-day lookback to catch recently-booked past/today events.
 */
export async function fetchAndSyncRecentEvents(userId: string) {
  const admin = createAdminClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - LOOKBACK_DAYS);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + LOOKAHEAD_DAYS);

  try {
    // Look up teacher email to exclude from attendees
    const { data: teacherProfile } = await admin
      .from('profiles')
      .select('email')
      .eq('user_id', userId)
      .single();
    const teacherEmail = teacherProfile?.email || '';

    const googleEvents = await getCalendarEventsInRangeAdmin(userId, startDate, endDate);
    logger.info('[WebhookSync] Fetched Google Calendar events', {
      userId,
      teacherEmail,
      totalEvents: googleEvents.length,
      window: `${LOOKBACK_DAYS}d back / ${LOOKAHEAD_DAYS}d forward`,
    });

    const guitarLessons = googleEvents.filter(
      (e) => isGuitarLesson(e) && e.attendees && e.attendees.length > 0
    );
    logger.info('[WebhookSync] Filtered guitar lessons', {
      userId,
      guitarLessons: guitarLessons.length,
      filtered: googleEvents.length - guitarLessons.length,
    });

    // Resolve student from attendees (exclude teacher, handle parent/student)
    const importEvents: ImportEvent[] = [];
    for (const e of guitarLessons) {
      const student = await resolveStudentAttendee(
        e.attendees as Array<{ email: string; displayName?: string }>,
        teacherEmail,
        admin
      );
      if (!student?.email) {
        logger.info('[WebhookSync] Skipped event — no student attendee found', {
          eventId: e.id,
          summary: e.summary,
        });
        continue;
      }
      importEvents.push({
        googleEventId: e.id,
        title: e.summary,
        notes: e.description,
        startTime: e.start.dateTime,
        attendeeEmail: student.email,
        attendeeName: student.displayName || '',
      });
    }

    if (importEvents.length === 0) {
      return { success: true, count: 0 };
    }

    const result = await syncGoogleEventsForUser(userId, importEvents);
    const imported = result.results.filter((r) => r.success).length;
    const skipped = result.results.filter((r) => !r.success).length;

    logger.info('[WebhookSync] Sync complete', {
      userId,
      imported,
      skipped,
    });

    return {
      success: true,
      count: imported,
      details: result,
    };
  } catch (error) {
    logger.error('[WebhookSync] Error syncing events:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
