'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getTeacherStudentIds } from '@/lib/queries/teacher-students';

export type TeacherDashboardData = {
  students: {
    id: string;
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    lessonsCompleted: number;
    nextLesson: string;
    avatar?: string;
  }[];
  activities: {
    id: string;
    type: 'lesson_completed' | 'song_added' | 'assignment_due' | 'assignment_submitted';
    message: string;
    time: string;
  }[];
  chartData: {
    name: string;
    lessons: number;
    assignments: number;
  }[];
  songs: {
    id: string;
    title: string;
    artist: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    duration: string;
    studentsLearning: number;
  }[];
  assignments: {
    id: string;
    title: string;
    studentName: string;
    dueDate: string;
    status: 'pending' | 'submitted' | 'overdue' | 'completed';
    songTitle?: string;
  }[];
  agenda: {
    id: string;
    type: 'lesson' | 'assignment' | 'task';
    title: string;
    time?: string;
    studentName?: string;
    status: 'upcoming' | 'completed' | 'overdue';
    description?: string;
  }[];
  stats: {
    totalStudents: number;
    songsInLibrary: number;
    lessonsThisWeek: number;
    pendingAssignments: number;
  };
  needsAttention: {
    id: string;
    studentId: string;
    studentName: string;
    reason: 'no_recent_lesson' | 'overdue_assignment' | 'inactive';
    daysAgo: number;
    actionUrl: string;
  }[];
};

type AssignmentStatus = 'pending' | 'submitted' | 'overdue' | 'completed';

interface AssignmentRow {
  id: string;
  title: string;
  status: string;
  due_date: string;
  created_at?: string;
  songs?: { title: string } | null;
  profiles?: { full_name: string } | null;
}

interface LessonRow {
  id: string;
  scheduled_at: string;
  profiles?: { full_name: string } | null;
}

const VALID_ASSIGNMENT_STATUSES: AssignmentStatus[] = ['pending', 'submitted', 'overdue', 'completed'];

const DIFFICULTY_MAP: Record<string, 'Easy' | 'Medium' | 'Hard'> = {
  beginner: 'Easy',
  intermediate: 'Medium',
  advanced: 'Hard',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getLevelFromLessonCount(count: number): 'Beginner' | 'Intermediate' | 'Advanced' {
  if (count >= 20) return 'Advanced';
  if (count >= 5) return 'Intermediate';
  return 'Beginner';
}

function getWeekBounds(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { weekStart: start.toISOString(), weekEnd: end.toISOString() };
}

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const { user, isTeacher, isAdmin } = await getUserWithRolesSSR();

  if (!user || (!isTeacher && !isAdmin)) {
    throw new Error('Unauthorized');
  }

  const supabase = await createClient();

  // Fetch only students taught by this teacher
  const studentIds = await getTeacherStudentIds(supabase, user.id);
  const { data: studentProfiles } = studentIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', studentIds)
    : { data: [] };

  // Fetch stats for each student
  const students = await Promise.all(
    studentProfiles?.map(async (profile) => {
      const { count: lessonsCompleted } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', profile.id)
        .lt('scheduled_at', new Date().toISOString());

      const { data: nextLesson } = await supabase
        .from('lessons')
        .select('scheduled_at')
        .eq('student_id', profile.id)
        .gt('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .single();

      const completedCount = lessonsCompleted || 0;

      return {
        id: profile.id,
        name: profile.full_name || 'Unknown',
        level: getLevelFromLessonCount(completedCount),
        lessonsCompleted: completedCount,
        nextLesson: nextLesson
          ? new Date(nextLesson.scheduled_at).toLocaleDateString()
          : 'No upcoming lessons',
        avatar: profile.avatar_url,
      };
    }) || []
  );

  // Activities moved to bottom

  // Chart data: real lesson counts per day of current week
  const { weekStart, weekEnd } = getWeekBounds();
  const { data: weekLessons } = await supabase
    .from('lessons')
    .select('scheduled_at')
    .gte('scheduled_at', weekStart)
    .lt('scheduled_at', weekEnd);

  const lessonsByDay = new Map<number, number>();
  const weekLessonsList = Array.isArray(weekLessons) ? weekLessons : [];
  for (const lesson of weekLessonsList) {
    const day = new Date(lesson.scheduled_at).getDay();
    lessonsByDay.set(day, (lessonsByDay.get(day) || 0) + 1);
  }

  const chartData: TeacherDashboardData['chartData'] = DAY_NAMES.map((name, index) => ({
    name,
    lessons: lessonsByDay.get(index) || 0,
    assignments: 0,
  }));

  // Songs: only songs used in this teacher's lessons (via lesson_songs)
  const { data: lessonSongLinks } = await supabase
    .from('lesson_songs')
    .select('song_id, lessons!inner(teacher_id)')
    .eq('lessons.teacher_id', user.id);

  const teacherSongIds = [...new Set((lessonSongLinks ?? []).map((r) => r.song_id))];

  const { data: songRows } = teacherSongIds.length > 0
    ? await supabase
        .from('songs')
        .select('id, title, author, level')
        .in('id', teacherSongIds)
        .order('created_at', { ascending: false })
        .limit(10)
    : { data: [] };

  const songs: TeacherDashboardData['songs'] = (songRows || []).map((song) => ({
    id: song.id,
    title: song.title,
    artist: song.author,
    difficulty: DIFFICULTY_MAP[song.level] || 'Medium',
    duration: '',
    studentsLearning: 0,
  }));

  // Assignments: fetch real assignments
  const { data: assignmentRows } = await supabase
    .from('assignments')
    .select('*, songs(title), profiles(full_name)')
    .order('due_date', { ascending: true })
    .limit(10);

  const assignments: TeacherDashboardData['assignments'] = (assignmentRows || []).map((asgn: AssignmentRow) => {
    const lowered = asgn.status.toLowerCase();
    const status: AssignmentStatus = VALID_ASSIGNMENT_STATUSES.includes(lowered as AssignmentStatus)
      ? (lowered as AssignmentStatus)
      : 'pending';
    return {
      id: asgn.id,
      title: asgn.title,
      studentName: asgn.profiles?.full_name || 'Unknown',
      dueDate: asgn.due_date,
      status,
      songTitle: asgn.songs?.title,
    };
  });

  // Agenda: Combining today's lessons and pending assignments
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const { data: todayLessons } = await supabase
    .from('lessons')
    .select('*, profiles!student_id(full_name)')
    .gte('scheduled_at', today.toISOString())
    .lt('scheduled_at', tomorrow.toISOString());

  const agenda: TeacherDashboardData['agenda'] = [
    ...(todayLessons || []).map((l: LessonRow) => ({
      id: l.id,
      type: 'lesson' as const,
      title: `Lesson with ${l.profiles?.full_name}`,
      time: new Date(l.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      studentName: l.profiles?.full_name,
      status: new Date(l.scheduled_at) < new Date() ? 'completed' as const : 'upcoming' as const,
    })),
    ...assignments
      .filter(a => new Date(a.dueDate) <= tomorrow)
      .map(a => ({
        id: a.id,
        type: 'assignment' as const,
        title: a.title,
        studentName: a.studentName,
        status: a.status === 'overdue' ? 'overdue' as const : 'upcoming' as const,
      }))
  ];

  // Activities: populating some real-ish activities based on data
  const activities: TeacherDashboardData['activities'] = [
    ...(todayLessons || []).slice(0, 3).map((l: LessonRow) => ({
      id: `act-l-${l.id}`,
      type: 'lesson_completed' as const,
      message: `Lesson with ${l.profiles?.full_name} scheduled`,
      time: new Date(l.scheduled_at).toLocaleTimeString(),
    })),
    ...(assignmentRows || []).slice(0, 2).map((a: AssignmentRow) => ({
      id: `act-a-${a.id}`,
      type: 'assignment_submitted' as const,
      message: `Assignment "${a.title}" for ${a.profiles?.full_name}`,
      time: new Date(a.created_at || a.due_date).toLocaleTimeString(),
    }))
  ].sort((a, b) => b.time.localeCompare(a.time));

  // Real stats from Supabase
  const songsCount = teacherSongIds.length;

  const { count: lessonsThisWeekCount } = await supabase
    .from('lessons')
    .select('*', { count: 'exact', head: true })
    .gte('scheduled_at', weekStart)
    .lt('scheduled_at', weekEnd);

  const { count: pendingAssignmentsCount } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
    .in('status', ['not_started', 'in_progress', 'pending']);

  // Needs-attention: students with no recent lesson (14+ days) or overdue assignments
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const needsAttention: TeacherDashboardData['needsAttention'] = [];

  for (const student of students) {
    // Check for overdue assignments
    const overdueForStudent = assignments.filter(
      (a) => a.studentName === student.name && a.status === 'overdue'
    );
    if (overdueForStudent.length > 0) {
      const oldestOverdue = overdueForStudent[0];
      const daysOverdue = Math.floor(
        (Date.now() - new Date(oldestOverdue.dueDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      needsAttention.push({
        id: `attn-asgn-${student.id}`,
        studentId: student.id,
        studentName: student.name,
        reason: 'overdue_assignment',
        daysAgo: Math.max(daysOverdue, 1),
        actionUrl: `/dashboard/users/${student.id}`,
      });
      continue;
    }

    // Check for no recent lesson
    const { data: lastLesson } = await supabase
      .from('lessons')
      .select('scheduled_at')
      .eq('student_id', student.id)
      .lt('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: false })
      .limit(1)
      .single();

    if (lastLesson) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastLesson.scheduled_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince >= 14) {
        needsAttention.push({
          id: `attn-lesson-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          reason: daysSince >= 30 ? 'inactive' : 'no_recent_lesson',
          daysAgo: daysSince,
          actionUrl: `/dashboard/users/${student.id}`,
        });
      }
    } else if (student.lessonsCompleted > 0) {
      // Had lessons before but none recently
      needsAttention.push({
        id: `attn-inactive-${student.id}`,
        studentId: student.id,
        studentName: student.name,
        reason: 'inactive',
        daysAgo: 30,
        actionUrl: `/dashboard/users/${student.id}`,
      });
    }
  }

  return {
    students,
    activities,
    chartData,
    songs,
    assignments,
    agenda,
    stats: {
      totalStudents: students.length,
      songsInLibrary: songsCount || 0,
      lessonsThisWeek: lessonsThisWeekCount || 0,
      pendingAssignments: pendingAssignmentsCount || 0,
    },
    needsAttention,
  };
}
