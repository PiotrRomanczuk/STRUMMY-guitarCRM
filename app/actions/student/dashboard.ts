'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { fetchRepertoireForDashboard } from './dashboard.repertoire';
import {
  computePracticeStreakDays,
  getMonToSunWeekBounds,
  WEEK_DAYS_MON,
} from './dashboard.helpers';

export type {
  DashboardRepertoireItem,
  StudentDashboardData,
  StudentChartDay,
} from './dashboard.types';
import type { DashboardRepertoireItem, StudentDashboardData } from './dashboard.types';

/**
 * @deprecated Use `DashboardRepertoireItem` instead. Kept as an alias for
 * downstream consumers that still import `RepertoireItem` from this module.
 */
export type RepertoireItem = DashboardRepertoireItem;

interface PracticeSessionRow {
  created_at: string;
  duration_minutes: number;
}

interface RepertoireStreakRow {
  last_practiced_at: string | null;
}

export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  const { user } = await getUserWithRolesSSR();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { weekStart, weekEnd } = getMonToSunWeekBounds();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch student profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  // Next Lesson
  const { data: nextLessonData } = await supabase
    .from('lessons')
    .select('id, title, scheduled_at')
    .eq('student_id', user.id)
    .gte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  // Last Lesson
  const { data: lastLessonData } = await supabase
    .from('lessons')
    .select('id, title, scheduled_at, notes')
    .eq('student_id', user.id)
    .lt('scheduled_at', now)
    .order('scheduled_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Active Assignments
  const { data: assignmentsData } = await supabase
    .from('assignments')
    .select('id, title, due_date, status, description')
    .eq('student_id', user.id)
    .in('status', ['not_started', 'in_progress'])
    .order('due_date', { ascending: true })
    .limit(5);

  // Recent Songs (via lesson_songs join)
  const { data: recentLessonSongs } = await supabase
    .from('lesson_songs')
    .select(
      `
      updated_at,
      songs (id, title, author, created_at),
      lessons!inner (student_id)
    `
    )
    .eq('lessons.student_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(5);

  // All Songs for Practice Timer
  const { data: allStudentSongs } = await supabase
    .from('songs')
    .select(
      `
      id,
      title,
      author,
      lesson_songs!inner(lessons!inner(student_id))
    `
    )
    .eq('lesson_songs.lessons.student_id', user.id);

  // Repertoire + Stats
  const { repertoire, totalSongs, practiceHours } = await fetchRepertoireForDashboard(
    supabase,
    user.id
  );

  // Completed lessons count
  const { count: completedLessons } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .lt('scheduled_at', now);

  // Practice streak: last_practiced_at per repertoire row in last 30 days
  const { data: streakRows } = await supabase
    .from('student_repertoire')
    .select('last_practiced_at')
    .eq('student_id', user.id)
    .gte('last_practiced_at', thirtyDaysAgo.toISOString())
    .not('last_practiced_at', 'is', null);

  const practicedDates = ((streakRows as RepertoireStreakRow[] | null) || [])
    .map((r) => r.last_practiced_at)
    .filter((d): d is string => d !== null);

  const practiceStreakDays = computePracticeStreakDays(practicedDates);

  // Real chart data: lessons + practice_sessions for current week (Mon..Sun)
  const { data: weekLessonRows } = await supabase
    .from('lessons')
    .select('scheduled_at')
    .eq('student_id', user.id)
    .gte('scheduled_at', weekStart.toISOString())
    .lt('scheduled_at', weekEnd.toISOString());

  // practiceMinutes per day from practice_sessions (created_at this week)
  // TODO: practiceMinutes will be 0 until practice_sessions has rows for this student.
  const { data: weekPracticeRows } = await supabase
    .from('practice_sessions')
    .select('created_at, duration_minutes')
    .eq('student_id', user.id)
    .gte('created_at', weekStart.toISOString())
    .lt('created_at', weekEnd.toISOString());

  // Build per-day maps
  const lessonsByDay = new Map<string, number>();
  for (const lesson of weekLessonRows ?? []) {
    const key = lesson.scheduled_at.slice(0, 10);
    lessonsByDay.set(key, (lessonsByDay.get(key) ?? 0) + 1);
  }

  const practiceByDay = new Map<string, number>();
  for (const ps of (weekPracticeRows as PracticeSessionRow[] | null) ?? []) {
    const key = ps.created_at.slice(0, 10);
    practiceByDay.set(key, (practiceByDay.get(key) ?? 0) + ps.duration_minutes);
  }

  const realChartData = WEEK_DAYS_MON.map((name, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(weekStart.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    return {
      day: name,
      lessons: lessonsByDay.get(key) ?? 0,
      practiceMinutes: practiceByDay.get(key) ?? 0,
    };
  });

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
      practiceHours,
    },
    practiceStreakDays,
    realChartData,
  };
}
