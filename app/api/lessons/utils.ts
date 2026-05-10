import { Lesson, LessonInput } from '@/schemas/LessonSchema';
import { logger } from '@/lib/logger';

// Helper types for query building
type SupabaseClientType = Awaited<
  ReturnType<typeof import('../../../lib/supabase/server').createClient>
>;

export async function handleLessonSongsUpdate(
  supabase: SupabaseClientType,
  lessonId: string,
  newSongIds: string[]
) {
  // 1. Get current songs
  const { data: currentSongs } = await supabase
    .from('lesson_songs')
    .select('song_id')
    .eq('lesson_id', lessonId);

  const currentSongIds = currentSongs?.map((s) => s.song_id) || [];

  // 2. Calculate diff
  const toDelete = currentSongIds.filter((sid) => !newSongIds.includes(sid));
  const toInsert = newSongIds.filter((sid) => !currentSongIds.includes(sid));

  // 3. Delete removed songs
  if (toDelete.length > 0) {
    await supabase.from('lesson_songs').delete().eq('lesson_id', lessonId).in('song_id', toDelete);
  }

  // 4. Insert new songs
  if (toInsert.length > 0) {
    const newRecords = toInsert.map((songId) => ({
      lesson_id: lessonId,
      song_id: songId,
      status: 'to_learn', // Default status — consistent with create path
    }));

    const { error: insertError } = await supabase.from('lesson_songs').insert(newRecords);
    if (insertError) {
      logger.error('Error inserting lesson songs:', insertError);
    }
  }
}

export async function addSongsToLesson(
  supabase: SupabaseClientType,
  lessonId: string,
  songIds: string[]
) {
  if (!songIds || songIds.length === 0) return;

  // Get the lesson to find the student_id and teacher_id
  const { data: lesson } = await supabase
    .from('lessons')
    .select('student_id, teacher_id')
    .eq('id', lessonId)
    .single();

  // Auto-create student_repertoire entries for songs not already in repertoire
  if (lesson?.student_id) {
    const repertoireEntries = songIds.map((songId) => ({
      student_id: lesson.student_id,
      song_id: songId,
      assigned_by: lesson.teacher_id,
      current_status: 'to_learn' as const,
    }));

    // Use upsert with ON CONFLICT DO NOTHING to skip existing entries
    await supabase
      .from('student_repertoire')
      .upsert(repertoireEntries, { onConflict: 'student_id,song_id', ignoreDuplicates: true });
  }

  // Now get repertoire_ids for the lesson_songs links
  let repertoireMap = new Map<string, string>();
  if (lesson?.student_id) {
    const { data: repertoireData } = await supabase
      .from('student_repertoire')
      .select('id, song_id')
      .eq('student_id', lesson.student_id)
      .in('song_id', songIds);

    repertoireMap = new Map((repertoireData || []).map((r) => [r.song_id, r.id]));
  }

  const lessonSongs = songIds.map((songId) => ({
    lesson_id: lessonId,
    song_id: songId,
    repertoire_id: repertoireMap.get(songId) || null,
  }));

  const { error: songsError } = await supabase.from('lesson_songs').insert(lessonSongs);

  if (songsError) {
    logger.error('Error adding songs to lesson:', songsError);
  }
}

export async function calculateNextLessonNumber(
  supabase: SupabaseClientType,
  teacherId: string,
  studentId: string
): Promise<number> {
  const { data: maxLesson } = await supabase
    .from('lessons')
    .select('lesson_teacher_number')
    .eq('teacher_id', teacherId)
    .eq('student_id', studentId)
    .order('lesson_teacher_number', { ascending: false })
    .limit(1)
    .single();

  return (maxLesson?.lesson_teacher_number || 0) + 1;
}

export async function insertLessonRecord(
  supabase: SupabaseClientType,
  lessonData: Partial<LessonInput>
) {
  const dbData = prepareLessonForDb(lessonData);

  // Note: lesson_teacher_number is auto-set by database trigger (set_lesson_numbers)
  // Do NOT manually set it here as it will conflict with the trigger

  return await supabase.from('lessons').insert(dbData).select().single();
}

/**
 * Transforms DB lesson data to match frontend schema
 * Maps scheduled_at -> date + start_time
 */
export function transformLessonData(lesson: Lesson & { scheduled_at?: string }) {
  const transformed = { ...lesson };

  // If we have scheduled_at but missing date/start_time (which are virtual/derived),
  // populate them from scheduled_at
  if (lesson.scheduled_at && (!lesson.date || !lesson.start_time)) {
    const dateObj = new Date(lesson.scheduled_at);

    // Format date as YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    transformed.date = `${year}-${month}-${day}`;

    // Format time as HH:MM
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    transformed.start_time = `${hours}:${minutes}`;
  }

  return transformed;
}

/**
 * Prepares frontend lesson input for DB insertion
 * Maps date + start_time -> scheduled_at
 */
export function prepareLessonForDb(lessonData: Partial<LessonInput>) {
  const dbData: Record<string, unknown> = { ...lessonData };

  // Combine date and start_time into scheduled_at (if date is provided)
  if (lessonData.date) {
    const timeStr = lessonData.start_time || '00:00';
    // Create date object from date and time strings
    // We use a simple string concatenation and let Date parse it
    // This assumes the input date/time are "local" to the user/server context
    const dateTimeStr = `${lessonData.date}T${timeStr}:00`;
    dbData.scheduled_at = new Date(dateTimeStr).toISOString();
  }

  // Remove virtual fields that don't exist in DB
  delete dbData.date;
  delete dbData.start_time;
  delete dbData.time;

  // Remove song_ids if it exists (should be handled separately)
  delete dbData.song_ids;

  // Remove auto-generated fields that are set by database triggers
  // lesson_number is auto-set by set_lesson_number() trigger
  delete dbData.lesson_number;
  delete dbData.lesson_teacher_number;

  // Remove fields that don't exist in the actual database schema
  delete dbData.creator_user_id;

  // Filter out undefined values to prevent Supabase JSONB operator errors
  Object.keys(dbData).forEach((key) => {
    if (dbData[key] === undefined) {
      delete dbData[key];
    }
  });

  return dbData;
}

/**
 * Past-date policy (see tasks/unbreakable-core.md → create-lesson:past-date-policy):
 *
 *   Backfilling is ALLOWED. A lesson with `scheduled_at` in the past is
 *   accepted by create/update (no 400) and flagged via `isBackfilledLesson()`
 *   so list views can label or filter it. Keeps "log what happened yesterday"
 *   open while making the flag explicit so the dashboard's "upcoming lesson"
 *   widgets can exclude it.
 *
 * @param lesson Lesson row with at least `{ scheduled_at }`.
 * @param now    Optional reference instant; defaults to `new Date()` so the
 *               helper is deterministic when called from tests.
 */
export function isBackfilledLesson(
  lesson: { scheduled_at?: string | null } | null | undefined,
  now: Date = new Date()
): boolean {
  if (!lesson?.scheduled_at) return false;
  const scheduled = new Date(lesson.scheduled_at);
  if (Number.isNaN(scheduled.getTime())) return false;
  return scheduled.getTime() < now.getTime();
}
