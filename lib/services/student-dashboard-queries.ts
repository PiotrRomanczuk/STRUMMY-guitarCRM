import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { deriveEffectiveStatus } from '@/lib/services/assignment-list-params';

export type StudentNextLesson = {
  id: string;
  scheduledAt: string;
  title: string | null;
  teacherName: string | null;
};

export type StudentSongRow = {
  songId: string;
  title: string;
  author: string | null;
  status: string;
  totalPracticeMinutes: number;
};

export type StudentOpenAssignment = {
  id: string;
  title: string;
  dueDate: string | null;
  isOverdue: boolean;
};

export async function getStudentNextLesson(studentId: string): Promise<StudentNextLesson | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('id, scheduled_at, title, teacher:profiles!lessons_teacher_id_fkey(full_name)')
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) logger.warn('[student-dashboard] next lesson error', { error: error.message });
    return null;
  }

  const teacher = Array.isArray(data.teacher) ? data.teacher[0] : data.teacher;
  return {
    id: data.id as string,
    scheduledAt: data.scheduled_at as string,
    title: (data.title as string) ?? null,
    teacherName: (teacher?.full_name as string) ?? null,
  };
}

export async function getStudentTopSongs(studentId: string, limit = 6): Promise<StudentSongRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('student_repertoire')
    .select('song_id, current_status, total_practice_minutes, songs:song_id(title, author)')
    .eq('student_id', studentId)
    .order('last_practiced_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    logger.warn('[student-dashboard] songs error', { error: error.message });
    return [];
  }

  return (data ?? [])
    .map((row) => {
      const song = Array.isArray(row.songs) ? row.songs[0] : row.songs;
      return {
        songId: row.song_id as string,
        // null title ⇒ the joined song row is unreadable under RLS (or gone);
        // surface nothing rather than an "Untitled" ghost entry.
        title: (song?.title as string) ?? '',
        author: (song?.author as string) ?? null,
        status: row.current_status as string,
        totalPracticeMinutes: (row.total_practice_minutes as number) ?? 0,
      };
    })
    .filter((row) => row.title !== '');
}

/** Open (not started / in progress) assignments for the student's dashboard,
 * overdue first, then by soonest due date. */
export async function getStudentOpenAssignments(
  studentId: string,
  limit = 4
): Promise<StudentOpenAssignment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assignments')
    .select('id, title, due_date, status')
    .eq('student_id', studentId)
    // 'overdue' should never be persisted (it is derived at read time), but
    // legacy rows exist with it — treat them as open too.
    .in('status', ['not_started', 'in_progress', 'overdue'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    logger.warn('[student-dashboard] assignments error', { error: error.message });
    return [];
  }

  return (data ?? [])
    .map((row) => ({
      id: row.id as string,
      title: row.title as string,
      dueDate: (row.due_date as string) ?? null,
      isOverdue:
        deriveEffectiveStatus((row.due_date as string) ?? null, row.status as string) === 'overdue',
    }))
    .sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue));
}
