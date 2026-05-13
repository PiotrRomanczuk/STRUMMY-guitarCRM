/**
 * Student Activity Status Service
 *
 * Automatically manages student_status transitions based on lesson activity:
 * - active → inactive: No completed lesson in 28 days + no future scheduled lessons
 * - inactive → active: Has future scheduled lesson or recent completed lesson
 *
 * Only affects students with status 'active' or 'inactive' (not lead/trial/churned)
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const INACTIVITY_DAYS = 28;

interface StatusUpdateResult {
  processed: number;
  activatedCount: number;
  deactivatedCount: number;
  activated: Array<{ id: string; email: string; full_name: string | null }>;
  deactivated: Array<{ id: string; email: string; full_name: string | null }>;
}

/**
 * Updates student activity status based on lesson activity
 * Called by daily cron job at 2 AM UTC
 */
export async function updateStudentActivityStatus(): Promise<StatusUpdateResult> {
  logger.info('updateStudentActivityStatus: start', {
    cutoffDays: INACTIVITY_DAYS,
  });

  const supabase = await createClient();
  const now = new Date();
  const cutoffDate = new Date(now);
  cutoffDate.setDate(cutoffDate.getDate() - INACTIVITY_DAYS);

  const result: StatusUpdateResult = {
    processed: 0,
    activatedCount: 0,
    deactivatedCount: 0,
    activated: [],
    deactivated: [],
  };

  // Get all students with 'active' or 'archived' status.
  // Note: profiles has no deleted_at column on prod (see #328) — the previous
  // .is('deleted_at', null) filter caused this query to throw silently and
  // the cron stopped flipping student_status months ago. Other tables that
  // do have deleted_at (lessons below) keep the filter.
  const { data: students, error: studentsError } = await supabase
    .from('profiles')
    .select('id, email, full_name, student_status')
    .eq('is_student', true)
    .in('student_status', ['active', 'archived']);

  if (studentsError) {
    logger.error('updateStudentActivityStatus: failed to fetch students', studentsError, {
      code: studentsError.code,
      details: studentsError.details,
      hint: studentsError.hint,
    });
    throw new Error(`Failed to fetch students: ${studentsError.message}`);
  }

  if (!students || students.length === 0) {
    logger.info('updateStudentActivityStatus: done', {
      processed: 0,
      activated: 0,
      deactivated: 0,
    });
    return result;
  }

  for (const student of students) {
    result.processed++;

    // Get last completed lesson
    const { data: lastCompleted } = await supabase
      .from('lessons')
      .select('scheduled_at')
      .eq('student_id', student.id)
      .eq('status', 'COMPLETED')
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: false })
      .limit(1)
      .single();

    // Get next scheduled lesson
    const { data: nextScheduled } = await supabase
      .from('lessons')
      .select('scheduled_at')
      .eq('student_id', student.id)
      .eq('status', 'SCHEDULED')
      .gte('scheduled_at', now.toISOString())
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: true })
      .limit(1)
      .single();

    const hasRecentLesson = !!lastCompleted && new Date(lastCompleted.scheduled_at) >= cutoffDate;
    const hasFutureLesson = !!nextScheduled;

    // Determine new status
    let newStatus = student.student_status;

    if (student.student_status === 'active') {
      // Archive if no recent lessons AND no future lessons
      if (!hasRecentLesson && !hasFutureLesson) {
        newStatus = 'archived';
      }
    } else if (student.student_status === 'archived') {
      // Reactivate if has recent lesson OR has future lesson
      if (hasRecentLesson || hasFutureLesson) {
        newStatus = 'active';
      }
    }

    // Update if status changed
    if (newStatus !== student.student_status) {
      await updateStudentStatus(supabase, student.id, student.student_status, newStatus, {
        hasRecentLesson,
        hasFutureLesson,
      });

      const studentInfo = {
        id: student.id,
        email: student.email,
        full_name: student.full_name,
      };

      if (newStatus === 'active') {
        result.activatedCount++;
        result.activated.push(studentInfo);
      } else {
        result.deactivatedCount++;
        result.deactivated.push(studentInfo);
      }
    }
  }

  logger.info('updateStudentActivityStatus: done', {
    processed: result.processed,
    activated: result.activatedCount,
    deactivated: result.deactivatedCount,
  });

  return result;
}

/**
 * Updates student status and logs to user_history
 */
async function updateStudentStatus(
  supabase: SupabaseClient,
  studentId: string,
  previousStatus: string,
  newStatus: string,
  context: { hasRecentLesson: boolean; hasFutureLesson: boolean }
) {
  // Update student_status
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      student_status: newStatus,
      status_changed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', studentId);

  if (updateError) {
    logger.error(`Failed to update student ${studentId}:`, updateError);
    return;
  }

  // Log to user_history
  const { error: historyError } = await supabase.from('user_history').insert({
    user_id: studentId,
    changed_by: null, // System-initiated change
    change_type: 'status_changed',
    previous_data: { student_status: previousStatus },
    new_data: { student_status: newStatus },
    notes:
      `Automatic status update: ${previousStatus} → ${newStatus}. ` +
      `Recent lesson (28d): ${context.hasRecentLesson}. ` +
      `Future lesson scheduled: ${context.hasFutureLesson}.`,
  });

  if (historyError) {
    logger.error(`Failed to log history for student ${studentId}:`, historyError);
  }
}
