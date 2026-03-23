'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { Database } from '@/database.types';
import { z } from 'zod';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation, assertNotTestAccount } from '@/lib/auth/test-account-guard';

import { sendNotification, cancelPendingQueueEntries } from '@/lib/services/notification-service';
import { logger } from '@/lib/logger';

const songIdsSchema = z.array(z.string().uuid());
const lessonSongStatusSchema = z.enum(['to_learn', 'started', 'remembered', 'with_author', 'mastered']);

export async function sendLessonSummaryEmail(lessonId: string) {
  const { isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return guard;

  logger.info(`[sendLessonSummaryEmail] Starting for lessonId: ${lessonId}`);
  const supabase = await createClient();

  try {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select(`
        *,
        student:profiles!lessons_student_id_fkey (
          id,
          email,
          full_name
        ),
        teacher:profiles!lessons_teacher_id_fkey (
          full_name
        ),
        lesson_songs (
          notes,
          status,
          song:songs (
            title,
            author
          )
        )
      `)
      .eq('id', lessonId)
      .single();

    if (error) {
      logger.error('Error fetching lesson details for email:', error);
      return { success: false, error: `Failed to fetch lesson details: ${error.message}` };
    }

    if (!lesson || !lesson.student) {
      return { success: false, error: 'Lesson or student not found' };
    }

    // @ts-expect-error - Supabase types are complex with joins
    const songs = lesson.lesson_songs?.map((ls) => ({
      title: ls.song?.title || 'Unknown Song',
      artist: ls.song?.author || 'Unknown Artist',
      status: ls.status,
    })) || [];

    const result = await sendNotification({
      type: 'lesson_recap',
      recipientUserId: lesson.student_id,
      templateData: {
        studentName: lesson.student.full_name || 'Student',
        teacherName: lesson.teacher?.full_name || 'Your Teacher',
        lessonDate: new Date(lesson.scheduled_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        }),
        lessonTitle: lesson.title || 'Guitar Lesson',
        songs,
        notes: lesson.notes || '',
      },
      entityType: 'lesson',
      entityId: lessonId,
    });

    if (!result.success) {
      logger.error('[sendLessonSummaryEmail] Notification service failed:', result.error);
      return { success: false, error: result.error || 'Failed to send email' };
    }

    // Cancel any pending queued recap for this lesson (from DB trigger)
    await cancelPendingQueueEntries('lesson', lessonId, 'lesson_recap');

    logger.info('[sendLessonSummaryEmail] Email sent successfully via notification service');
    return { success: true };
  } catch (error) {
    logger.error('[sendLessonSummaryEmail] Exception:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function getAvailableSongs() {
  const supabase = await createClient();

  const { data, error } = await supabase.from('songs').select('id, title, author').order('title');

  if (error) {
    logger.error('Error fetching songs:', error);
    throw new Error('Failed to fetch songs');
  }

  return data;
}

export async function updateLessonSongs(lessonId: string, songIds: string[]) {
  const { isDevelopment } = await getUserWithRolesSSR();
  assertNotTestAccount(isDevelopment);

  const parsedLessonId = z.string().uuid().safeParse(lessonId);
  const parsedSongIds = songIdsSchema.safeParse(songIds);
  if (!parsedLessonId.success || !parsedSongIds.success) {
    throw new Error('Invalid lesson or song IDs');
  }

  const supabase = await createClient();

  // Get current songs to calculate diff
  const { data: currentSongs, error: fetchError } = await supabase
    .from('lesson_songs')
    .select('song_id')
    .eq('lesson_id', lessonId);

  if (fetchError) {
    logger.error('Error fetching existing lesson songs:', fetchError);
    throw new Error('Failed to update lesson songs');
  }

  const currentSongIds = currentSongs.map((s) => s.song_id);

  const songsToAdd = songIds.filter((id) => !currentSongIds.includes(id));
  const songsToRemove = currentSongIds.filter((id) => !songIds.includes(id));

  // Delete removed songs
  if (songsToRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('lesson_songs')
      .delete()
      .eq('lesson_id', lessonId)
      .in('song_id', songsToRemove);

    if (deleteError) {
      logger.error('Error deleting removed lesson songs:', deleteError);
      throw new Error('Failed to update lesson songs');
    }
  }

  // Insert new songs
  if (songsToAdd.length > 0) {
    const { error: insertError } = await supabase.from('lesson_songs').insert(
      songsToAdd.map((songId) => ({
        lesson_id: lessonId,
        song_id: songId,
        status: 'to_learn',
      }))
    );

    if (insertError) {
      logger.error('Error inserting new lesson songs:', insertError);
      throw new Error('Failed to update lesson songs');
    }
  }

  revalidatePath(`/dashboard/lessons/${lessonId}`);
}

export async function updateLessonSongStatus(
  lessonId: string,
  songId: string,
  status: Database['public']['Enums']['lesson_song_status']
) {
  const { isDevelopment } = await getUserWithRolesSSR();
  assertNotTestAccount(isDevelopment);

  const parsed = z.object({
    lessonId: z.string().uuid(),
    songId: z.string().uuid(),
    status: lessonSongStatusSchema,
  }).safeParse({ lessonId, songId, status });
  if (!parsed.success) {
    throw new Error('Invalid lesson song status input');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('lesson_songs')
    .update({ status })
    .eq('lesson_id', lessonId)
    .eq('song_id', songId);

  if (error) {
    logger.error('Error updating lesson song status:', error);
    throw new Error('Failed to update lesson song status');
  }

  // Cascade to student_repertoire is handled by the DB trigger
  // fn_sync_lesson_song_to_repertoire (migration 20260222000001).

  revalidatePath(`/dashboard/lessons/${lessonId}`);
}

const lessonSongNotesSchema = z.object({
  lessonId: z.string().uuid(),
  songId: z.string().uuid(),
  notes: z.string().max(2000, 'Song notes cannot exceed 2000 characters'),
});

export async function updateLessonSongNotes(
  lessonId: string,
  songId: string,
  notes: string
): Promise<{ success: true } | { error: string }> {
  const { isDevelopment } = await getUserWithRolesSSR();
  assertNotTestAccount(isDevelopment);

  const parsed = lessonSongNotesSchema.safeParse({ lessonId, songId, notes });
  if (!parsed.success) {
    return { error: 'Invalid input for song notes' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('lesson_songs')
    .update({ notes: parsed.data.notes })
    .eq('lesson_id', parsed.data.lessonId)
    .eq('song_id', parsed.data.songId);

  if (error) {
    logger.error('Error updating lesson song notes:', error);
    return { error: 'Failed to save song notes' };
  }

  revalidatePath(`/dashboard/lessons/${lessonId}`);
  return { success: true };
}

export interface AssignableLesson {
  id: string;
  scheduled_at: string;
  title: string | null;
  student: {
    id: string;
    full_name: string | null;
  };
}

/**
 * Get lessons available for song assignment
 * Returns lessons from past 7 days + all future lessons
 * Ordered by date DESC (most recent first)
 */
export async function getAssignableLessons(): Promise<AssignableLesson[]> {
  const supabase = await createClient();

  // Calculate date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('lessons')
    .select(`
      id,
      scheduled_at,
      title,
      student:profiles!lessons_student_id_fkey (
        id,
        full_name
      )
    `)
    .gte('scheduled_at', sevenDaysAgo.toISOString())
    .order('scheduled_at', { ascending: false });

  if (error) {
    logger.error('Error fetching assignable lessons:', error);
    throw new Error('Failed to fetch lessons');
  }

  // Transform the data to match the expected type (student is an array from Supabase join)
  return (data || []).map((lesson) => ({
    id: lesson.id,
    scheduled_at: lesson.scheduled_at,
    title: lesson.title,
    student: Array.isArray(lesson.student) ? lesson.student[0] : lesson.student,
  })) as AssignableLesson[];
}

export async function quickAssignSongFromLesson(
  lessonId: string,
  songId: string,
  songTitle: string,
  studentId: string
): Promise<{ success: true; assignmentId: string } | { alreadyExists: true } | { error: string }> {
  const { isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: 'Unauthorized' };

  const { data: existing } = await supabase
    .from('assignments')
    .select('id')
    .eq('lesson_id', lessonId)
    .eq('title', `Practice: ${songTitle}`)
    .eq('student_id', studentId)
    .maybeSingle();

  if (existing) return { alreadyExists: true };

  const { data: nextLesson } = await supabase
    .from('lessons')
    .select('scheduled_at')
    .eq('student_id', studentId)
    .eq('status', 'SCHEDULED')
    .gt('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const dueDate = nextLesson?.scheduled_at
    || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('assignments')
    .insert({
      title: `Practice: ${songTitle}`,
      student_id: studentId,
      teacher_id: user.id,
      lesson_id: lessonId,
      due_date: dueDate,
      status: 'not_started',
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to quick-assign song:', error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/lessons/${lessonId}`);
  return { success: true, assignmentId: data.id };
}

export async function bulkAssignSongsFromLesson(
  lessonId: string,
  songs: { id: string; title: string }[],
  studentId: string
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;
  for (const song of songs) {
    const result = await quickAssignSongFromLesson(lessonId, song.id, song.title, studentId);
    if ('success' in result) created++;
    else skipped++;
  }
  return { created, skipped };
}
