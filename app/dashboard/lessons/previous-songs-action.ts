'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { logger } from '@/lib/logger';
import { z } from 'zod';

export interface PreviousLessonSong {
  songId: string;
  title: string;
  author: string;
  status: string;
}

interface PreviousLessonSongsResult {
  songs: PreviousLessonSong[];
  lessonDate: string | null;
}

interface PreviousLessonSongsError {
  error: string;
}

/**
 * Fetch songs from a student's most recent completed (or any past) lesson.
 * Used by the "Copy from last lesson" quick action in lesson forms.
 */
export async function getLastLessonSongs(
  studentId: string
): Promise<PreviousLessonSongsResult | PreviousLessonSongsError> {
  const parsed = z.string().uuid().safeParse(studentId);
  if (!parsed.success) return { error: 'Invalid student ID' };

  const { user, isAdmin, isTeacher } = await getUserWithRolesSSR();
  if (!user) return { error: 'Unauthorized' };
  if (!isAdmin && !isTeacher) return { error: 'Only teachers can access this' };

  const supabase = await createClient();

  // Find the most recent lesson for this student that has songs attached.
  // Prefer COMPLETED, but fall back to any status with songs.
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select(`
      id,
      scheduled_at,
      lesson_songs (
        song_id,
        status,
        song:songs ( id, title, author )
      )
    `)
    .eq('student_id', studentId)
    .eq('teacher_id', user.id)
    .not('lesson_songs', 'is', null)
    .order('scheduled_at', { ascending: false })
    .limit(5);

  if (lessonError) {
    logger.error('[getLastLessonSongs] Query error:', lessonError);
    return { error: 'Failed to fetch previous lesson songs' };
  }

  // Find the first lesson that actually has lesson_songs rows
  const lessonWithSongs = (lesson ?? []).find(
    (l) => Array.isArray(l.lesson_songs) && l.lesson_songs.length > 0
  );

  if (!lessonWithSongs) {
    return { songs: [], lessonDate: null };
  }

  const songs: PreviousLessonSong[] = lessonWithSongs.lesson_songs
    .filter(
      (ls): ls is typeof ls & { song: { id: string; title: string; author: string } } =>
        ls.song !== null && typeof ls.song === 'object' && !Array.isArray(ls.song)
    )
    .map((ls) => ({
      songId: ls.song.id,
      title: ls.song.title,
      author: ls.song.author,
      status: ls.status,
    }));

  return {
    songs,
    lessonDate: lessonWithSongs.scheduled_at,
  };
}
