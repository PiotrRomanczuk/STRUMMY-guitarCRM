import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type LessonDetail = {
  id: string;
  scheduledAt: string;
  status: string;
  title: string | null;
  notes: string | null;
  lessonTeacherNumber: number | null;
  durationMinutes: number | null;
  format: string | null;
  teacherId: string;
  teacherName: string | null;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  songs: {
    songId: string;
    title: string;
    author: string | null;
    key: string | null;
    status: string | null;
  }[];
};

export type LessonAssignment = {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
};

export type ContinuityLesson = {
  id: string;
  lessonTeacherNumber: number | null;
  scheduledAt: string;
  title: string | null;
  notes: string | null;
  status: string;
};

export async function getLessonDetail(lessonId: string): Promise<LessonDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lessons')
    .select(
      'id, scheduled_at, status, title, notes, lesson_teacher_number, duration_minutes, format, teacher_id, student_id, teacher:profiles!lessons_teacher_id_fkey(full_name), student:profiles!lessons_student_id_fkey(full_name, email), lesson_songs(song_id, status, songs(title, author, key))'
    )
    .eq('id', lessonId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      logger.warn('[lesson-detail-queries] error', { error: error.message, code: error.code });
    }
    return null;
  }

  const teacher = Array.isArray(data.teacher) ? data.teacher[0] : data.teacher;
  const student = Array.isArray(data.student) ? data.student[0] : data.student;
  const songs = (data.lesson_songs ?? [])
    .map((ls) => {
      const song = Array.isArray(ls.songs) ? ls.songs[0] : ls.songs;
      if (!song) return null;
      return {
        songId: ls.song_id as string,
        title: song.title as string,
        author: (song.author as string) ?? null,
        key: (song.key as string) ?? null,
        status: (ls.status as string) ?? null,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  return {
    id: data.id as string,
    scheduledAt: data.scheduled_at as string,
    status: data.status as string,
    title: (data.title as string) ?? null,
    notes: (data.notes as string) ?? null,
    lessonTeacherNumber: (data.lesson_teacher_number as number) ?? null,
    durationMinutes: (data.duration_minutes as number | null) ?? null,
    format: (data.format as string | null) ?? null,
    teacherId: data.teacher_id as string,
    teacherName: (teacher?.full_name as string) ?? null,
    studentId: data.student_id as string,
    studentName: (student?.full_name as string) ?? null,
    studentEmail: (student?.email as string) ?? null,
    songs,
  };
}

/** Homework attached to this lesson (assignments whose lesson_id matches). */
export async function getLessonAssignments(lessonId: string): Promise<LessonAssignment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assignments')
    .select('id, title, due_date, status')
    .eq('lesson_id', lessonId)
    .is('deleted_at', null)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) {
    logger.warn('[lesson-detail-queries] assignments error', {
      error: error.message,
      code: error.code,
    });
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    dueDate: (row.due_date as string) ?? null,
    status: (row.status as string) ?? 'not_started',
  }));
}

/** Recent previous lessons with the same student (for the continuity card). */
export async function getLessonContinuity(
  studentId: string,
  excludeLessonId: string,
  limit = 3
): Promise<ContinuityLesson[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('id, lesson_teacher_number, scheduled_at, title, notes, status')
    .eq('student_id', studentId)
    .neq('id', excludeLessonId)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn('[lesson-detail-queries] continuity error', {
      error: error.message,
      code: error.code,
    });
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    lessonTeacherNumber: (row.lesson_teacher_number as number) ?? null,
    scheduledAt: row.scheduled_at as string,
    title: (row.title as string) ?? null,
    notes: (row.notes as string) ?? null,
    status: (row.status as string) ?? 'SCHEDULED',
  }));
}
