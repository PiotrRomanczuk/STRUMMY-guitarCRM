import { createAdminClient } from '@/lib/supabase/admin';
import { reconcileEventAttendee } from '@/lib/google';
import { createLogger } from '@/lib/logger';

const log = createLogger('calendar-reconcile');

export interface ReconcileResult {
  reconciled: number;
  failed: number;
  skipped: number;
}

/**
 * Spec 06.3 — after a shadow student claims their account, swap the attendee on
 * their FUTURE Google Calendar events from the placeholder to the real email.
 *
 * Best-effort and per-event isolated: one Google API failure is logged (Pino →
 * system_logs, the admin-visible error stream per ADR-0003) and does NOT abort
 * the others or roll back the (already-committed) link. Each teacher's own
 * Google client patches their own events.
 */
export async function reconcileCalendarForStudent(studentId: string): Promise<ReconcileResult> {
  const admin = createAdminClient();
  const result: ReconcileResult = { reconciled: 0, failed: 0, skipped: 0 };

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('email')
    .eq('id', studentId)
    .single();

  if (profileError || !profile?.email) {
    log.error('Reconcile: cannot resolve student email', profileError, { studentId });
    return result;
  }
  const realEmail = profile.email as string;

  const { data: lessons, error: lessonsError } = await admin
    .from('lessons')
    .select('id, teacher_id, google_event_id')
    .eq('student_id', studentId)
    .not('google_event_id', 'is', null)
    .gt('scheduled_at', new Date().toISOString());

  if (lessonsError) {
    log.error('Reconcile: failed to load future lessons', lessonsError, { studentId });
    return result;
  }

  for (const lesson of lessons ?? []) {
    if (!lesson.teacher_id || !lesson.google_event_id) {
      result.skipped++;
      continue;
    }
    try {
      await reconcileEventAttendee(lesson.teacher_id, lesson.google_event_id, realEmail);
      result.reconciled++;
    } catch (error) {
      result.failed++;
      // Dead-letter: surfaced in system_logs (ADR-0003), never silently dropped.
      log.error('Reconcile: failed to swap attendee', error, {
        studentId,
        lessonId: lesson.id,
        googleEventId: lesson.google_event_id,
        reason: 'reconcile_failed',
      });
    }
  }

  log.info('Reconcile complete', { studentId, ...result });
  return result;
}
