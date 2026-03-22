'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/database.types';
import { logger } from '@/lib/logger';

export type SongStudentItem = {
  studentId: string;
  name: string;
  status: Database['public']['Enums']['lesson_song_status'];
  lastPlayed: string;
};

export async function getSongStudents(songId: string): Promise<SongStudentItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lesson_songs')
    .select(
      `
      status,
      created_at,
      lessons!inner (
        scheduled_at,
        profiles!lessons_student_id_fkey!inner (
          id,
          full_name
        )
      )
    `
    )
    .eq('song_id', songId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Error fetching song students:', error);
    throw new Error('Failed to fetch song students');
  }

  const studentMap = new Map<string, SongStudentItem>();

  data.forEach((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lesson = Array.isArray(item.lessons) ? item.lessons[0] : (item.lessons as any);
    if (!lesson || !lesson.profiles) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const student = Array.isArray(lesson.profiles) ? lesson.profiles[0] : (lesson.profiles as any);
    if (!student) return;

    const studentId = student.id;

    // Since ordered by created_at desc, first one is latest
    if (!studentMap.has(studentId)) {
      const name = student.full_name || 'Unknown Student';

      studentMap.set(studentId, {
        studentId,
        name,
        status: item.status,
        lastPlayed: lesson.scheduled_at || item.created_at,
      });
    }
  });

  return Array.from(studentMap.values());
}

export type RepertoireStudentItem = {
  id: string;
  current_status: string;
  started_at: string | null;
  mastered_at: string | null;
  self_rating: number | null;
  total_practice_minutes: number;
  last_practiced_at: string | null;
  priority: string;
  student: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
};

export async function getSongStudentsFromRepertoire(
  songId: string
): Promise<RepertoireStudentItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('student_repertoire')
    .select(
      `
      id, current_status, started_at, mastered_at,
      self_rating, total_practice_minutes, last_practiced_at, priority,
      student:profiles!student_repertoire_student_id_fkey(
        id, full_name, email, avatar_url
      )
    `
    )
    .eq('song_id', songId)
    .eq('is_active', true)
    .order('current_status', { ascending: false });

  if (error) {
    logger.error('Error fetching song students from repertoire:', error);
    return [];
  }

  return (data as unknown as RepertoireStudentItem[]) || [];
}
