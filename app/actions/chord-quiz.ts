'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import { ChordQuizSessionSchema } from '@/schemas/ChordQuizAttemptSchema';
import { createLogger } from '@/lib/logger';

const log = createLogger('chord-quiz-actions');

type SubmitResult = { success: true; inserted: number } | { error: string };

/**
 * Persist a batch of chord-quiz attempts for the currently authenticated student.
 * One round-trip per session. The student_id is taken from the session, never the input.
 */
export async function submitChordQuizSession(input: unknown): Promise<SubmitResult> {
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

  revalidatePath('/dashboard/skills/chord-quiz');
  return { success: true, inserted: rows.length };
}
