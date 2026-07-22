'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import { ChordQuizSessionSchema } from '@/schemas/ChordQuizAttemptSchema';
import { createLogger } from '@/lib/logger';
import { updateChordSRSBatch } from './chord-srs';

const log = createLogger('chord-quiz-actions');

type SubmitResult = { success: true; inserted: number } | { error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Persist a batch of chord-quiz attempts for the currently authenticated student.
 * One round-trip per session. The student_id is taken from the session, never the input.
 *
 * When `drillAssignmentId` is given, this is a teacher-assigned chord drill (ASG-4):
 * after logging attempts + SRS, the score is stamped back onto the assignment via
 * the `student_complete_chord_drill` RPC (the DB-scoped student write path).
 */
export async function submitChordQuizSession(
  input: unknown,
  drillAssignmentId?: string
): Promise<SubmitResult> {
  const { isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const parsed = ChordQuizSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const rows = parsed.data.map((attempt) => ({
    student_id: user.id,
    chord_id: attempt.chord_id,
    selected_answer: attempt.selected_answer,
    is_correct: attempt.is_correct,
    response_time_ms: attempt.response_time_ms ?? null,
  }));

  const { error } = await supabase.from('chord_quiz_attempts').insert(rows);
  if (error) {
    log.error('Failed to submit chord quiz session', {
      userId: user.id,
      attempts: rows.length,
      error,
    });
    return { error: error.message };
  }

  // Update SRS state — non-blocking; quiz save already succeeded above.
  const srsResult = await updateChordSRSBatch(
    parsed.data.map((a) => ({ chord_id: a.chord_id, is_correct: a.is_correct }))
  );
  if ('error' in srsResult) {
    log.warn('SRS update failed after quiz submit', { userId: user.id, error: srsResult.error });
  }

  // ASG-4: stamp the drill result back onto the assignment. Unlike the SRS
  // update, this is the point of a drill — surface a failure so the student can
  // retry (attempts are append-only, so a retry is harmless).
  if (drillAssignmentId) {
    if (!UUID_RE.test(drillAssignmentId)) {
      return { error: 'Invalid drill reference' };
    }
    const score = parsed.data.filter((a) => a.is_correct).length;
    const { error: drillError } = await supabase.rpc('student_complete_chord_drill', {
      p_assignment_id: drillAssignmentId,
      p_score: score,
      p_total: parsed.data.length,
    });
    if (drillError) {
      log.error('Failed to record chord drill result', {
        userId: user.id,
        drillAssignmentId,
        error: drillError,
      });
      return { error: drillError.message };
    }
    revalidatePath(`/dashboard/assignments/${drillAssignmentId}`);
  }

  revalidatePath('/dashboard/skills/chord-quiz');
  return { success: true, inserted: rows.length };
}
