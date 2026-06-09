import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type DayLessonSong = {
  songId: string;
  title: string;
  songKey: string | null;
};

export type DayLesson = {
  id: string;
  scheduledAt: string;
  status: string;
  title: string | null;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  songs: DayLessonSong[];
};

const todayBoundsUtc = (now: Date): { start: string; end: string } => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
};

export async function getTeacherDayLessons(teacherId: string, now: Date): Promise<DayLesson[]> {
  const supabase = await createClient();
  const { start, end } = todayBoundsUtc(now);

  const { data, error } = await supabase
    .from('lessons')
    .select(
      'id, scheduled_at, status, title, student:profiles!lessons_student_id_fkey(id, full_name, email), lesson_songs(song_id, songs(title, key))'
    )
    .eq('teacher_id', teacherId)
    .is('deleted_at', null)
    .gte('scheduled_at', start)
    .lt('scheduled_at', end)
    .order('scheduled_at', { ascending: true });

  if (error) {
    logger.warn('[teacher-dashboard-queries] day lessons error', {
      error: error.message,
      code: error.code,
    });
    return [];
  }

  return (data ?? []).map((row) => {
    const student = Array.isArray(row.student) ? row.student[0] : row.student;
    const songs: DayLessonSong[] = (row.lesson_songs ?? [])
      .map((ls) => {
        const songRow = Array.isArray(ls.songs) ? ls.songs[0] : ls.songs;
        if (!songRow) return null;
        return {
          songId: ls.song_id as string,
          title: songRow.title as string,
          songKey: (songRow.key as string | null) ?? null,
        };
      })
      .filter((s): s is DayLessonSong => s !== null);

    return {
      id: row.id as string,
      scheduledAt: row.scheduled_at as string,
      status: row.status as string,
      title: row.title as string | null,
      studentId: (student?.id as string) ?? '',
      studentName: (student?.full_name as string) ?? null,
      studentEmail: (student?.email as string) ?? null,
      songs,
    };
  });
}

export type TeacherDayStats = {
  count: number;
  totalMinutes: number;
};

const DEFAULT_LESSON_MINUTES = 45;

export const summariseDayLessons = (lessons: DayLesson[]): TeacherDayStats => ({
  count: lessons.length,
  totalMinutes: lessons.length * DEFAULT_LESSON_MINUTES,
});
