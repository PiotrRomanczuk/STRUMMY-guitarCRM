'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { assertNotTestAccount } from '@/lib/auth/test-account-guard';
import { SongStatusEnum } from '@/schemas/LessonSchema';
import { logger } from '@/lib/logger';

export async function updateLessonSongStatus(lessonSongId: string, status: string) {
  const { isAdmin, isTeacher, isDevelopment } = await getUserWithRolesSSR();
  assertNotTestAccount(isDevelopment);

  if (!isAdmin && !isTeacher) {
    throw new Error('Unauthorized');
  }

  // Validate status against the correct enum
  const parsed = SongStatusEnum.safeParse(status);
  if (!parsed.success) {
    throw new Error(
      `Invalid song status: ${status}. Must be one of: ${SongStatusEnum.options.join(', ')}`
    );
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('lesson_songs')
    .update({ status: parsed.data })
    .eq('id', lessonSongId);

  if (error) {
    logger.error('Error updating lesson song status:', error);
    throw new Error('Failed to update status');
  }

  // Note: No revalidatePath needed - client handles optimistic updates
  // This prevents unnecessary full-page refreshes
}

/**
 * Normalize category name to title case
 * Examples: "rock" → "Rock", "rock music" → "Rock Music"
 */
function normalizeCategory(category: string): string {
  return category
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export interface CategoryWithCount {
  name: string;
  count: number;
}

/**
 * Get existing song categories with usage counts
 * Returns categories sorted by usage (most popular first)
 */
export async function getExistingCategories(): Promise<CategoryWithCount[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('songs')
    .select('category')
    .not('category', 'is', null)
    .neq('category', '');

  if (error) {
    logger.error('Error fetching categories:', error);
    return [];
  }

  // Group by normalized category name and count usage
  const categoryMap = new Map<string, number>();

  data?.forEach((song) => {
    if (song.category) {
      const normalized = normalizeCategory(song.category);
      categoryMap.set(normalized, (categoryMap.get(normalized) || 0) + 1);
    }
  });

  // Convert to array and sort by count (most used first)
  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export interface QuickAssignResult {
  success: boolean;
  error?: string;
  isUpdate?: boolean;
}

/**
 * Quick assign a song to a lesson
 * Creates lesson_song relationship with initial status
 * If song already in lesson, updates status instead (UPSERT)
 */
export async function quickAssignSongToLesson(
  songId: string,
  lessonId: string,
  initialStatus: string = 'to_learn'
): Promise<QuickAssignResult> {
  const { isAdmin, isTeacher, isDevelopment } = await getUserWithRolesSSR();
  assertNotTestAccount(isDevelopment);

  if (!isAdmin && !isTeacher) {
    return { success: false, error: 'Unauthorized' };
  }

  // Validate status
  const parsed = SongStatusEnum.safeParse(initialStatus);
  if (!parsed.success) {
    return {
      success: false,
      error: `Invalid status: ${initialStatus}. Must be one of: ${SongStatusEnum.options.join(', ')}`,
    };
  }

  const supabase = await createClient();

  // Check if lesson exists and belongs to teacher (RLS will handle this)
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id')
    .eq('id', lessonId)
    .single();

  if (lessonError || !lesson) {
    return { success: false, error: 'Lesson not found or access denied' };
  }

  // Check if song already exists in this lesson
  const { data: existing } = await supabase
    .from('lesson_songs')
    .select('id')
    .eq('lesson_id', lessonId)
    .eq('song_id', songId)
    .maybeSingle();

  const isUpdate = !!existing;

  // UPSERT: Insert if new, update if exists
  const { error } = await supabase.from('lesson_songs').upsert(
    {
      lesson_id: lessonId,
      song_id: songId,
      status: parsed.data,
    },
    {
      onConflict: 'lesson_id,song_id',
    }
  );

  if (error) {
    logger.error('Error assigning song to lesson:', error);
    return { success: false, error: 'Failed to assign song' };
  }

  // Revalidate both the lesson detail page and songs page
  revalidatePath(`/dashboard/lessons/${lessonId}`);
  revalidatePath('/dashboard/songs');

  return { success: true, isUpdate };
}

export interface DuplicateCheckResult {
  exists: boolean;
  existingTitle?: string;
  existingAuthor?: string;
}

/**
 * Check if a song with the same normalized title+author already exists
 */
export async function checkSongDuplicate(params: {
  title: string;
  author: string;
  excludeId?: string;
}): Promise<DuplicateCheckResult> {
  const supabase = await createClient();
  const title = params.title.trim();
  const author = params.author.trim();

  if (!title || !author) return { exists: false };

  let query = supabase
    .from('songs')
    .select('id, title, author')
    .is('deleted_at', null)
    .ilike('title', title)
    .ilike('author', author)
    .limit(1);

  if (params.excludeId) {
    query = query.neq('id', params.excludeId);
  }

  const { data } = await query;
  if (data && data.length > 0) {
    return { exists: true, existingTitle: data[0].title, existingAuthor: data[0].author };
  }
  return { exists: false };
}

export interface BulkDeleteResult {
  success: boolean;
  deletedCount: number;
  errors: string[];
}

/**
 * Bulk soft-delete songs using the soft_delete_song_with_cascade RPC
 */
export async function bulkSoftDeleteSongs(songIds: string[]): Promise<BulkDeleteResult> {
  const { isAdmin, isTeacher, user, isDevelopment } = await getUserWithRolesSSR();
  assertNotTestAccount(isDevelopment);

  if (!isAdmin && !isTeacher) {
    return { success: false, deletedCount: 0, errors: ['Unauthorized'] };
  }

  if (!user) {
    return { success: false, deletedCount: 0, errors: ['User not authenticated'] };
  }

  if (songIds.length === 0) {
    return { success: true, deletedCount: 0, errors: [] };
  }

  const supabase = await createClient();
  let deletedCount = 0;
  const errors: string[] = [];

  for (const songId of songIds) {
    const { data, error } = await supabase.rpc('soft_delete_song_with_cascade', {
      song_uuid: songId,
      user_uuid: user.id,
    });

    if (error) {
      errors.push(`Failed to delete song ${songId}: ${error.message}`);
      continue;
    }

    const result = data as { success: boolean; error?: string };
    if (result.success) {
      deletedCount++;
    } else {
      errors.push(result.error || `Failed to delete song ${songId}`);
    }
  }

  revalidatePath('/dashboard/songs');

  return {
    success: errors.length === 0,
    deletedCount,
    errors,
  };
}

export type RecordingState = 'idle' | 'queued' | 'recorded';

export interface RecordingStateResult {
  success: boolean;
  state: RecordingState;
  recordingQueuedAt: string | null;
  recordedAt: string | null;
  error?: string;
}

const IDLE_RESULT = (error: string): RecordingStateResult => ({
  success: false,
  state: 'idle',
  recordingQueuedAt: null,
  recordedAt: null,
  error,
});

export async function setSongRecordingState(
  songId: string,
  next: RecordingState
): Promise<RecordingStateResult> {
  const { isAdmin, isTeacher, isDevelopment } = await getUserWithRolesSSR();
  assertNotTestAccount(isDevelopment);

  if (!isAdmin && !isTeacher) {
    return IDLE_RESULT('Unauthorized');
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const update =
    next === 'idle'
      ? { recording_queued_at: null, recorded_at: null }
      : next === 'queued'
        ? { recording_queued_at: now, recorded_at: null }
        : { recording_queued_at: null, recorded_at: now };

  const { error } = await supabase.from('songs').update(update).eq('id', songId);

  if (error) {
    logger.error('Failed to update song recording state:', error);
    return IDLE_RESULT(error.message);
  }

  revalidatePath('/dashboard/songs');

  return {
    success: true,
    state: next,
    recordingQueuedAt: update.recording_queued_at,
    recordedAt: update.recorded_at,
  };
}

/**
 * Cycles through idle → queued → recorded → idle. Used by the song-row button.
 */
export async function cycleSongRecordingState(songId: string): Promise<RecordingStateResult> {
  const { isAdmin, isTeacher, isDevelopment } = await getUserWithRolesSSR();
  assertNotTestAccount(isDevelopment);

  if (!isAdmin && !isTeacher) {
    return IDLE_RESULT('Unauthorized');
  }

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('songs')
    .select('recording_queued_at, recorded_at')
    .eq('id', songId)
    .single();

  if (fetchError || !existing) {
    logger.error('Failed to fetch song for recording-state cycle:', fetchError);
    return IDLE_RESULT('Song not found');
  }

  const current: RecordingState = existing.recorded_at
    ? 'recorded'
    : existing.recording_queued_at
      ? 'queued'
      : 'idle';

  const nextState: RecordingState =
    current === 'idle' ? 'queued' : current === 'queued' ? 'recorded' : 'idle';

  return setSongRecordingState(songId, nextState);
}
