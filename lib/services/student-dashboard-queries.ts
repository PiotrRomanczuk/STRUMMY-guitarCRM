import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

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

  return (data ?? []).map((row) => {
    const song = Array.isArray(row.songs) ? row.songs[0] : row.songs;
    return {
      songId: row.song_id as string,
      title: (song?.title as string) ?? 'Untitled',
      author: (song?.author as string) ?? null,
      status: row.current_status as string,
      totalPracticeMinutes: (row.total_practice_minutes as number) ?? 0,
    };
  });
}
