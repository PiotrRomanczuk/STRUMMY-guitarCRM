'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import { PracticeSessionInputSchema } from '@/schemas/PracticeSessionSchema';
import { createLogger } from '@/lib/logger';

const log = createLogger('practice-actions');

interface RepertoireSong {
  id: string;
  song_id: string;
  song: { id: string; title: string; author: string | null };
}

/**
 * Log a practice session for the currently authenticated student.
 * The DB trigger auto-updates student_repertoire practice metrics.
 */
export async function logPracticeSession(
  input: unknown
): Promise<{ success: true; sessionId: string } | { error: string }> {
  // 1. Test account guard
  const { isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };

  // 2. Auth check
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  // 3. Validate input
  const parsed = PracticeSessionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // 4. Insert practice session
  const { data, error } = await supabase
    .from('practice_sessions')
    .insert({
      student_id: user.id,
      song_id: parsed.data.song_id ?? null,
      duration_minutes: parsed.data.duration_minutes,
      notes: parsed.data.notes ?? null,
    })
    .select('id')
    .single();

  if (error) {
    log.error('Failed to log practice session', { input: parsed.data, error });
    return { error: error.message };
  }

  // 5. Revalidate relevant paths
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/repertoire');
  revalidatePath('/dashboard/practice');

  return { success: true, sessionId: data.id };
}

/**
 * Fetch the student's repertoire songs for the practice form dropdown.
 * Returns a lightweight list of song_id + title + author.
 */
export async function getStudentRepertoireSongs(): Promise<
  { songs: Array<{ songId: string; title: string; author: string | null }> } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('student_repertoire')
    .select('id, song_id, song:songs!inner(id, title, author)')
    .eq('student_id', user.id)
    .eq('is_active', true)
    .order('priority', { ascending: true });

  if (error) {
    log.error('Failed to fetch repertoire songs', { userId: user.id, error });
    return { error: error.message };
  }

  const songs = (data as unknown as RepertoireSong[]).map((entry) => ({
    songId: entry.song.id,
    title: entry.song.title,
    author: entry.song.author,
  }));

  return { songs };
}
