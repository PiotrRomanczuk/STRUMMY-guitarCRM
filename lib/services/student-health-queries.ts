import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { bucketPracticeByDay, type PracticeDay } from './student-health.helpers';

/**
 * Server-only queries backing the student-detail health surface (practice
 * chart, next lesson, latest note, practice log). Never import this from a
 * client component — it pulls lib/supabase/server → next/headers.
 */

export type PracticeSessionRow = {
  id: string;
  createdAt: string;
  durationMinutes: number;
  songTitle: string | null;
  notes: string | null;
};

export type NextLesson = {
  id: string;
  scheduledAt: string;
  status: string;
  title: string | null;
} | null;

export type LatestNote = {
  lessonId: string;
  lessonTitle: string | null;
  scheduledAt: string;
  note: string;
} | null;

export async function getStudentPracticeSessions(
  studentId: string,
  limit = 30
): Promise<PracticeSessionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('practice_sessions')
    .select('id, created_at, duration_minutes, notes, songs:song_id(title)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn('[student-health-queries] sessions error', { error: error.message });
    return [];
  }

  return (data ?? []).map((row) => {
    const song = Array.isArray(row.songs) ? row.songs[0] : row.songs;
    return {
      id: row.id as string,
      createdAt: row.created_at as string,
      durationMinutes: (row.duration_minutes as number) ?? 0,
      songTitle: (song?.title as string) ?? null,
      notes: (row.notes as string) ?? null,
    };
  });
}

export async function getStudentPracticeHistory(
  studentId: string,
  days = 14,
  now: Date = new Date()
): Promise<PracticeDay[]> {
  const supabase = await createClient();
  const since = new Date(now.getTime() - days * 86_400_000).toISOString();
  const { data, error } = await supabase
    .from('practice_sessions')
    .select('created_at, duration_minutes')
    .eq('student_id', studentId)
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (error) {
    logger.warn('[student-health-queries] history error', { error: error.message });
    return bucketPracticeByDay([], days, now);
  }

  const sessions = (data ?? []).map((row) => ({
    createdAt: row.created_at as string,
    durationMinutes: (row.duration_minutes as number) ?? 0,
  }));
  return bucketPracticeByDay(sessions, days, now);
}

export async function getStudentNextLesson(
  studentId: string,
  now: Date = new Date()
): Promise<NextLesson> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('id, scheduled_at, status, title')
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .gte('scheduled_at', now.toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id as string,
    scheduledAt: data.scheduled_at as string,
    status: data.status as string,
    title: (data.title as string) ?? null,
  };
}

export async function getStudentLatestNote(studentId: string): Promise<LatestNote> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('id, title, scheduled_at, notes')
    .eq('student_id', studentId)
    .is('deleted_at', null)
    .not('notes', 'is', null)
    .neq('notes', '')
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    lessonId: data.id as string,
    lessonTitle: (data.title as string) ?? null,
    scheduledAt: data.scheduled_at as string,
    note: data.notes as string,
  };
}
