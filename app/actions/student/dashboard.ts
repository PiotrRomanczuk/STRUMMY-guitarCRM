'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';

export type RepertoireItem = {
  id: string;
  song_id: string;
  title: string;
  artist: string;
  current_status: string;
  self_rating: number | null;
  priority: string;
  last_practiced_at: string | null;
  total_practice_minutes: number;
};

export type StudentDashboardData = {
  studentName: string | null;
  nextLesson: {
    id: string;
    title: string | null;
    scheduled_at: string;
  } | null;
  lastLesson: {
    id: string;
    title: string | null;
    scheduled_at: string;
    notes: string | null;
  } | null;
  assignments: {
    id: string;
    title: string;
    due_date: string | null;
    status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
    description: string | null;
  }[];
  recentSongs: {
    id: string;
    title: string;
    artist: string;
    last_played: string;
  }[];
  repertoire: RepertoireItem[];
  allSongs: {
    id: string;
    title: string;
    artist: string;
  }[];
  stats: {
    totalSongs: number;
    completedLessons: number;
    activeAssignments: number;
    practiceHours: number;
  };
};

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

  // 4. Fetch Stats
  const { count: totalSongs } = await supabase
    .from('songs')
    .select('lesson_songs!inner(lessons!inner(student_id))', { count: 'exact', head: true })
    .eq('lesson_songs.lessons.student_id', user.id);

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
    repertoire: [], // TODO: populate from student_repertoire in next iteration
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
      totalSongs: totalSongs || 0,
      completedLessons: completedLessons || 0,
      activeAssignments: assignmentsData?.length || 0,
      practiceHours: Math.round(totalPracticeMinutes / 60),
    },
  };
}
