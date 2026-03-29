'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import {
  CreateRepertoireInputSchema,
  UpdateRepertoireInputSchema,
} from '@/schemas/StudentRepertoireSchema';
import type { StudentRepertoireWithSong } from '@/types/StudentRepertoire';
import { createLogger } from '@/lib/logger';

const log = createLogger('repertoire-actions');

export async function getStudentRepertoireAction(
  studentId: string
): Promise<{ data: StudentRepertoireWithSong[] } | { error: string }> {
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
    .select(
      `
      *,
      song:songs!inner (
        id, title, author, level, key, capo_fret, strumming_pattern
      )
    `
    )
    .eq('student_id', studentId)
    .order('priority', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error) {
    log.error('Failed to fetch repertoire', { studentId, error });
    return { error: error.message };
  }

  const mapped = (data || []).map((row) => ({
    ...row,
    song: Array.isArray(row.song) ? row.song[0] : row.song,
  })) as StudentRepertoireWithSong[];

  return { data: mapped };
}

export async function addSongToRepertoireAction(input: {
  student_id: string;
  song_id: string;
  preferred_key?: string | null;
  capo_fret?: number | null;
  custom_strumming?: string | null;
  teacher_notes?: string | null;
  priority?: string;
  assigned_by?: string;
}): Promise<{ success: true; id: string } | { error: string }> {
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

  const parsed = CreateRepertoireInputSchema.safeParse({
    ...input,
    assigned_by: input.assigned_by || user.id,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { data, error } = await supabase
    .from('student_repertoire')
    .insert(parsed.data)
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: 'This song is already in the student repertoire' };
    }
    log.error('Failed to add song to repertoire', { input, error });
    return { error: error.message };
  }

  revalidatePath(`/dashboard/users/${input.student_id}`);
  return { success: true, id: data.id };
}

export async function updateRepertoireEntryAction(
  repertoireId: string,
  input: Record<string, unknown>
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

  const parsed = UpdateRepertoireInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const updateData: Record<string, unknown> = { ...parsed.data };

  // Auto-set timestamps based on status changes
  if (parsed.data.current_status === 'started' && !updateData.started_at) {
    updateData.started_at = new Date().toISOString();
  }
  if (parsed.data.current_status === 'mastered' && !updateData.mastered_at) {
    updateData.mastered_at = new Date().toISOString();
  }

  const { data: existing, error: fetchError } = await supabase
    .from('student_repertoire')
    .select('student_id')
    .eq('id', repertoireId)
    .single();

  if (fetchError || !existing) {
    return { error: 'Repertoire entry not found' };
  }

  const { error } = await supabase
    .from('student_repertoire')
    .update(updateData)
    .eq('id', repertoireId);

  if (error) {
    log.error('Failed to update repertoire entry', { repertoireId, error });
    return { error: error.message };
  }

  revalidatePath(`/dashboard/users/${existing.student_id}`);
  return { success: true };
}

export async function removeFromRepertoireAction(
  repertoireId: string
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

  // Fetch student_id for cache revalidation
  const { data: existing } = await supabase
    .from('student_repertoire')
    .select('student_id')
    .eq('id', repertoireId)
    .single();

  const { error } = await supabase
    .from('student_repertoire')
    .delete()
    .eq('id', repertoireId);

  if (error) {
    log.error('Failed to remove from repertoire', { repertoireId, error });
    return { error: error.message };
  }

  if (existing) {
    revalidatePath(`/dashboard/users/${existing.student_id}`);
  }
  return { success: true };
}

export async function addSongToNextLessonAction(
  studentId: string,
  songId: string
): Promise<
  | { success: true; lessonId: string; scheduledAt: string }
  | { alreadyInLesson: true; lessonId: string; scheduledAt: string }
  | { noLesson: true }
  | { error: string }
> {
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

  // Find the next upcoming SCHEDULED lesson for this student
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, scheduled_at')
    .eq('student_id', studentId)
    .eq('status', 'SCHEDULED')
    .gt('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .single();

  if (lessonError || !lesson) {
    return { noLesson: true };
  }

  // Check if the song is already in this lesson
  const { data: existing } = await supabase
    .from('lesson_songs')
    .select('id')
    .eq('lesson_id', lesson.id)
    .eq('song_id', songId)
    .single();

  if (existing) {
    return { alreadyInLesson: true, lessonId: lesson.id, scheduledAt: lesson.scheduled_at };
  }

  // Insert — DB trigger auto-creates/links student_repertoire entry
  const { error: insertError } = await supabase
    .from('lesson_songs')
    .insert({ lesson_id: lesson.id, song_id: songId });

  if (insertError) {
    log.error('Failed to add song to next lesson', { studentId, songId, error: insertError });
    return { error: insertError.message };
  }

  revalidatePath(`/dashboard/users/${studentId}`);
  revalidatePath(`/dashboard/lessons/${lesson.id}`);
  return { success: true, lessonId: lesson.id, scheduledAt: lesson.scheduled_at };
}

export async function searchSongsForRepertoireAction(
  query: string,
  studentId: string
): Promise<{ data: Array<{ id: string; title: string; author: string; level: string | null; key: string | null }> } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  // First get songs already in repertoire to exclude them
  const { data: existing } = await supabase
    .from('student_repertoire')
    .select('song_id')
    .eq('student_id', studentId);

  const existingSongIds = (existing || []).map((e) => e.song_id);

  // Search songs
  let songQuery = supabase
    .from('songs')
    .select('id, title, author, level, key')
    .is('deleted_at', null)
    .eq('is_draft', false)
    .order('title', { ascending: true })
    .limit(20);

  if (query.trim()) {
    songQuery = songQuery.or(`title.ilike.%${query}%,author.ilike.%${query}%`);
  }

  const { data: songs, error } = await songQuery;

  if (error) {
    log.error('Failed to search songs', { query, error });
    return { error: error.message };
  }

  // Filter out already-in-repertoire songs on the client
  const filtered = (songs || []).filter((s) => !existingSongIds.includes(s.id));
  return { data: filtered };
}

export interface SongProgressEntry {
  current_status: string;
  last_practiced_at: string | null;
  total_practice_minutes: number;
  self_rating: number | null;
}

export type SongProgressMap = Record<string, SongProgressEntry>;

/**
 * Lightweight action to fetch a student's repertoire progress as a map keyed by song_id.
 * Used by the lesson song selector to show progress indicators inline.
 */
export async function getStudentSongProgressAction(
  studentId: string
): Promise<{ progressMap: SongProgressMap } | { error: string }> {
  if (!studentId) return { progressMap: {} };

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
    .select('song_id, current_status, last_practiced_at, total_practice_minutes, self_rating')
    .eq('student_id', studentId);

  if (error) {
    log.error('Failed to fetch song progress', { studentId, error });
    return { error: error.message };
  }

  const progressMap: SongProgressMap = {};
  for (const row of data || []) {
    progressMap[row.song_id] = {
      current_status: row.current_status,
      last_practiced_at: row.last_practiced_at,
      total_practice_minutes: row.total_practice_minutes,
      self_rating: row.self_rating,
    };
  }

  return { progressMap };
}
