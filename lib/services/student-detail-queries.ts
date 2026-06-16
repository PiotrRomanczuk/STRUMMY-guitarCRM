import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type StudentProfile = {
  id: string;
  fullName: string | null;
  email: string | null;
  createdAt: string | null;
  isShadow: boolean;
  inviteEmail: string | null;
};

export type StudentRepertoireRow = {
  songId: string;
  songTitle: string;
  songAuthor: string | null;
  status: string;
  totalPracticeMinutes: number;
  lastPracticedAt: string | null;
};

export type StudentRecentLesson = {
  id: string;
  scheduledAt: string;
  status: string;
  title: string | null;
};

export async function getStudentProfile(studentId: string): Promise<StudentProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, created_at, is_shadow, invite_email')
    .eq('id', studentId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      logger.warn('[student-detail-queries] profile error', {
        error: error.message,
        code: error.code,
      });
    }
    return null;
  }

  return {
    id: data.id as string,
    fullName: (data.full_name as string) ?? null,
    email: (data.email as string) ?? null,
    createdAt: (data.created_at as string) ?? null,
    isShadow: (data.is_shadow as boolean) ?? false,
    inviteEmail: (data.invite_email as string) ?? null,
  };
}

export async function getStudentRepertoire(
  studentId: string,
  limit = 20
): Promise<StudentRepertoireRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('student_repertoire')
    .select(
      'song_id, current_status, total_practice_minutes, last_practiced_at, songs:song_id(title, author)'
    )
    .eq('student_id', studentId)
    .order('last_practiced_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    logger.warn('[student-detail-queries] repertoire error', {
      error: error.message,
      code: error.code,
    });
    return [];
  }

  return (data ?? []).map((row) => {
    const song = Array.isArray(row.songs) ? row.songs[0] : row.songs;
    return {
      songId: row.song_id as string,
      songTitle: (song?.title as string) ?? 'Untitled',
      songAuthor: (song?.author as string) ?? null,
      status: row.current_status as string,
      totalPracticeMinutes: (row.total_practice_minutes as number) ?? 0,
      lastPracticedAt: (row.last_practiced_at as string) ?? null,
    };
  });
}

export async function getStudentRecentLessons(
  studentId: string,
  limit = 8
): Promise<StudentRecentLesson[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('id, scheduled_at, status, title')
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn('[student-detail-queries] lessons error', {
      error: error.message,
      code: error.code,
    });
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    scheduledAt: row.scheduled_at as string,
    status: row.status as string,
    title: (row.title as string) ?? null,
  }));
}

export const totalPracticeMinutes = (rows: StudentRepertoireRow[]): number =>
  rows.reduce((sum, r) => sum + r.totalPracticeMinutes, 0);
