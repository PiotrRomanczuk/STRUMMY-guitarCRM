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

export interface PracticeSessionWithSong {
  id: string;
  song_id: string | null;
  song: { id: string; title: string; author: string | null } | null;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
  /** True only when the session was logged today (same-day undo eligible). */
  canUndo: boolean;
}

interface PracticeSessionRow {
  id: string;
  song_id: string | null;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
  song:
    | { id: string; title: string; author: string | null }
    | { id: string; title: string; author: string | null }[]
    | null;
}

function isLoggedToday(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  return (
    created.getFullYear() === now.getFullYear() &&
    created.getMonth() === now.getMonth() &&
    created.getDate() === now.getDate()
  );
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

/**
 * Read practice-session history. Students see their own sessions (RLS
 * `practice_sessions_select_own`); staff may pass a `studentId` and read it via
 * `practice_sessions_select_staff`. Each row carries `canUndo` (logged today).
 */
export async function getPracticeSessions(
  studentId?: string
): Promise<{ sessions: PracticeSessionWithSong[] } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const targetId = studentId ?? user.id;

  const { data, error } = await supabase
    .from('practice_sessions')
    .select('id, song_id, duration_minutes, notes, created_at, song:songs(id, title, author)')
    .eq('student_id', targetId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    log.error('Failed to fetch practice sessions', { targetId, error });
    return { error: error.message };
  }

  const sessions: PracticeSessionWithSong[] = (data as unknown as PracticeSessionRow[]).map(
    (row) => {
      const song = Array.isArray(row.song) ? (row.song[0] ?? null) : row.song;
      return {
        id: row.id,
        song_id: row.song_id,
        song: song ?? null,
        duration_minutes: row.duration_minutes,
        notes: row.notes,
        created_at: row.created_at,
        canUndo: isLoggedToday(row.created_at),
      };
    }
  );

  return { sessions };
}

/**
 * Undo a practice session logged today. RLS
 * (`practice_sessions_delete_own_today`) is the authority: a next-day delete
 * matches 0 rows. The AFTER DELETE trigger reverses the practice metrics.
 */
export async function deletePracticeSession(
  id: string
): Promise<{ success: true } | { error: string }> {
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

  const { data, error } = await supabase
    .from('practice_sessions')
    .delete()
    .eq('id', id)
    .select('id');

  if (error) {
    log.error('Failed to delete practice session', { id, error });
    return { error: error.message };
  }

  // 0 rows ⇒ RLS rejected (not same-day / not owner). Surface a clear message.
  if (!data || data.length === 0) {
    return { error: 'Sessions can only be undone the same day they are logged.' };
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/repertoire');
  revalidatePath('/dashboard/practice');

  return { success: true };
}
