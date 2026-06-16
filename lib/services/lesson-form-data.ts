import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type StudentOption = {
  id: string;
  name: string | null;
  email: string | null;
};

export type SongOption = {
  id: string;
  title: string;
  author: string | null;
};

export type LessonEditData = {
  id: string;
  studentId: string;
  teacherId: string;
  title: string | null;
  notes: string | null;
  scheduledAt: string;
  status: string;
  songIds: string[];
};

/**
 * Students this teacher may pick when creating a lesson. Admins see every
 * student; teachers see only those in the `teacher_students` view (RLS-scoped).
 * Teachers can read profiles via the "Teachers can read all profiles" policy.
 */
export async function getStudentOptions(
  userId: string,
  isAdmin: boolean
): Promise<StudentOption[]> {
  const supabase = await createClient();

  if (isAdmin) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_student', true)
      .order('full_name', { ascending: true });
    if (error) {
      logger.warn('[lesson-form-data] admin student options error', { error: error.message });
      return [];
    }
    return (data ?? []).map(toStudentOption);
  }

  const { data: pairs, error: pairsError } = await supabase
    .from('teacher_students')
    .select('student_id')
    .eq('teacher_id', userId);
  if (pairsError || !pairs || pairs.length === 0) return [];

  const ids = Array.from(new Set(pairs.map((p) => p.student_id))).filter(Boolean);
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', ids)
    .order('full_name', { ascending: true });
  if (error) {
    logger.warn('[lesson-form-data] teacher student options error', { error: error.message });
    return [];
  }
  return (data ?? []).map(toStudentOption);
}

const toStudentOption = (row: {
  id: string;
  full_name: string | null;
  email: string | null;
}): StudentOption => ({
  id: row.id,
  name: row.full_name ?? null,
  email: row.email ?? null,
});

/** All active songs (teachers/admins may read the full library via RLS). */
export async function getSongOptions(): Promise<SongOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('songs')
    .select('id, title, author')
    .is('deleted_at', null)
    .order('title', { ascending: true });
  if (error) {
    logger.warn('[lesson-form-data] song options error', { error: error.message });
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    author: (row.author as string) ?? null,
  }));
}

/** Load a single lesson for the edit form (RLS-scoped). Returns null if hidden. */
export async function getLessonForEdit(lessonId: string): Promise<LessonEditData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('id, student_id, teacher_id, title, notes, scheduled_at, status, lesson_songs(song_id)')
    .eq('id', lessonId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    if (error && error.code !== 'PGRST116') {
      logger.warn('[lesson-form-data] lesson-for-edit error', { error: error.message });
    }
    return null;
  }

  return {
    id: data.id as string,
    studentId: data.student_id as string,
    teacherId: data.teacher_id as string,
    title: (data.title as string) ?? null,
    notes: (data.notes as string) ?? null,
    scheduledAt: data.scheduled_at as string,
    status: data.status as string,
    songIds: (data.lesson_songs ?? []).map((ls: { song_id: string }) => ls.song_id),
  };
}
