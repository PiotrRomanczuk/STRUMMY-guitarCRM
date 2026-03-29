'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { fetchRepertoireForDashboard } from './dashboard.repertoire';

export type { DashboardRepertoireItem, StudentDashboardData } from './dashboard.types';
import type { StudentDashboardData } from './dashboard.types';

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const { user } = await getUserWithRolesSSR();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Fetch student profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // 0. Fetch Next Lesson
  const { data: nextLessonData } = await supabase
    .from('lessons')
    .select('id, title, scheduled_at')
    .eq('student_id', user.id)
    .gte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  // 1. Fetch Last Lesson
  const { data: lastLessonData } = await supabase
    .from('lessons')
    .select('id, title, scheduled_at, notes')
    .eq('student_id', user.id)
    .lt('scheduled_at', now)
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2. Fetch Active Assignments (not completed, not cancelled)
  const { data: assignmentsData } = await supabase
    .from('assignments')
    .select('id, title, due_date, status, description')
    .eq('student_id', user.id)
    .in('status', ['not_started', 'in_progress'])
    .order('due_date', { ascending: true })
    .limit(5);

  // 3. Fetch Recent Songs (from lesson_songs join songs)
  const { data: recentLessonSongs } = await supabase
    .from('lesson_songs')
    .select(
      `
      updated_at,
      songs (
        id,
        title,
        author,
        created_at
      ),
      lessons!inner (
        student_id
      )
    `
    )
    .eq('lessons.student_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(5);

  // 3.1 Fetch All Songs for Practice Timer
  const { data: allStudentSongs } = await supabase
    .from('songs')
    .select(
      `
      id,
      title,
      author,
      lesson_songs!inner(
        lessons!inner(student_id)
      )
    `
    )
    .eq('lesson_songs.lessons.student_id', user.id);

  // 4. Fetch Repertoire + Stats
  const { repertoire, totalSongs, practiceHours } = await fetchRepertoireForDashboard(
    supabase,
    user.id
  );

  // 5. Completed lessons count
  const { count: completedLessons } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .lt('scheduled_at', now);

  // 5. Fetch total practice minutes from student_repertoire
  const { data: practiceData } = await supabase
    .from('student_repertoire')
    .select('total_practice_minutes')
    .eq('student_id', user.id);

  const totalPracticeMinutes = (practiceData || []).reduce(
    (sum, r) => sum + (r.total_practice_minutes || 0),
    0
  );

  return {
    studentName: profileData?.full_name || null,
    nextLesson: nextLessonData,
    lastLesson: lastLessonData,
    assignments: assignmentsData || [],
    repertoire,
    recentSongs:
      recentLessonSongs
        ?.filter((ls) => ls.songs !== null)
        .map((ls) => {
          const song = Array.isArray(ls.songs) ? ls.songs[0] : ls.songs;
          return {
            id: song?.id ?? '',
            title: song?.title ?? '',
            artist: song?.author ?? '',
            last_played: ls.updated_at,
          };
        })
        .filter((s) => s.id !== '') || [],
    allSongs:
      allStudentSongs?.map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.author || 'Unknown Artist',
      })) || [],
    stats: {
      totalSongs,
      completedLessons: completedLessons || 0,
      activeAssignments: assignmentsData?.length || 0,
      practiceHours: Math.round(totalPracticeMinutes / 60),
    },
  };
}
