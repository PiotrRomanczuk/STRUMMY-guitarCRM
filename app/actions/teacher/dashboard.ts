'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getTeacherStudentIds } from '@/lib/queries/teacher-students';
import {
  getLevelFromLessonCount,
  getWeekBounds,
  buildStudentLessonMetrics,
  countOverdueAssignments,
  countRepertoire,
  buildWeekChartData,
  computeNeedsAttention,
  DIFFICULTY_MAP,
  type LessonStub,
  type AssignmentStub,
  type RepertoireStub,
} from './dashboard.helpers';

export type TeacherDashboardData = {
  students: {
    id: string;
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    lessonsCompleted: number;
    /** @deprecated Use nextLessonAt instead. Kept for backwards compat. */
    nextLesson: string;
    lastLessonAt: string | null;
    nextLessonAt: string | null;
    overdueAssignmentCount: number;
    repertoireCount: number;
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
    assignmentsCreated: number;
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
  weeklySummary: {
    lessonsTaught: number;
    lessonsScheduled: number;
    assignmentsCreated: number;
    assignmentsCompleted: number;
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
  created_at: string;
  student_id: string;
  songs?: { title: string } | null;
  profiles?: { full_name: string } | null;
}

const VALID_ASSIGNMENT_STATUSES: AssignmentStatus[] = [
  'pending',
  'submitted',
  'overdue',
  'completed',
];

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const { user, isTeacher, isAdmin } = await getUserWithRolesSSR();

  if (!user || (!isTeacher && !isAdmin)) {
    throw new Error('Unauthorized');
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { weekStart, weekEnd } = getWeekBounds();

  // ── Query 1: student profiles ──────────────────────────────────────────────
  const studentIds = await getTeacherStudentIds(supabase, user.id);
  const { data: studentProfiles } =
    studentIds.length > 0
      ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', studentIds)
      : { data: [] };

  const profiles = studentProfiles ?? [];

  // ── Query 2: ALL lessons for these students (batch — replaces N+1) ─────────
  const { data: allStudentLessons } =
    studentIds.length > 0
      ? await supabase
          .from('lessons')
          .select('id, student_id, scheduled_at')
          .in('student_id', studentIds)
          .order('scheduled_at', { ascending: true })
      : { data: [] };

  const allLessons: LessonStub[] = (allStudentLessons ?? []) as LessonStub[];

  // ── Query 3: ALL assignments for these students (batch) ────────────────────
  // Single batched assignments query — used for: per-student overdue count,
  // chart's assignmentsCreated this week, weeklySummary.assignmentsCompleted.
  const { data: allStudentAssignments } =
    studentIds.length > 0
      ? await supabase
          .from('assignments')
          .select('id, student_id, status, due_date, created_at, updated_at')
          .in('student_id', studentIds)
          .is('deleted_at', null)
      : { data: [] };

  const allAssignments: (AssignmentStub & { updated_at: string })[] = (allStudentAssignments ??
    []) as (AssignmentStub & { updated_at: string })[];

  // ── Query 4: ALL active repertoire for these students (batch) ──────────────
  const { data: allStudentRepertoire } =
    studentIds.length > 0
      ? await supabase
          .from('student_repertoire')
          .select('student_id')
          .in('student_id', studentIds)
          .eq('is_active', true)
      : { data: [] };

  const allRepertoire: RepertoireStub[] = (allStudentRepertoire ?? []) as RepertoireStub[];

  // ── Derive per-student metrics in JS (no more N+1) ─────────────────────────
  const students: TeacherDashboardData['students'] = profiles.map((profile) => {
    const { lessonsCompleted, lastLessonAt, nextLessonAt } = buildStudentLessonMetrics(
      profile.id,
      allLessons,
      now
    );
    const overdueAssignmentCount = countOverdueAssignments(profile.id, allAssignments, now);
    const repertoireCount = countRepertoire(profile.id, allRepertoire);

    return {
      id: profile.id,
      name: profile.full_name || 'Unknown',
      level: getLevelFromLessonCount(lessonsCompleted),
      lessonsCompleted,
      lastLessonAt,
      nextLessonAt,
      overdueAssignmentCount,
      repertoireCount,
      // Kept for backwards compat — UI should migrate to nextLessonAt
      nextLesson: nextLessonAt
        ? new Date(nextLessonAt).toLocaleDateString()
        : 'No upcoming lessons',
      avatar: profile.avatar_url,
    };
  });

  // Week lessons derived in-memory from batched allLessons (no extra query).
  // Note: scope is "this teacher's students" — same as the rest of dashboard.
  const weekLessons = allLessons.filter(
    (l) => l.scheduled_at >= weekStart && l.scheduled_at < weekEnd
  );

  // ── Query 6: assignments with full data for display panel ─────────────────
  const { data: assignmentRows } = await supabase
    .from('assignments')
    .select(
      'id, title, status, due_date, created_at, student_id, songs(title), profiles(full_name)'
    )
    .is('deleted_at', null)
    .order('due_date', { ascending: true })
    .limit(10);

  // Cast via `unknown` because Supabase's generated type infers
  // joined `songs(title)` / `profiles(full_name)` as arrays even though
  // they are single rows at runtime (FK cardinality unknown at query time).
  const displayAssignments: TeacherDashboardData['assignments'] = (
    (assignmentRows ?? []) as unknown as AssignmentRow[]
  ).map((asgn) => {
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

  // Week assignments derived in-memory from the batched allAssignments
  // (no extra query). Filter by created_at within this week.
  const weekAssignments = allAssignments.filter(
    (a) => a.created_at >= weekStart && a.created_at < weekEnd
  );

  // ── Query 8: songs via lesson_songs ───────────────────────────────────────
  const { data: lessonSongLinks } = await supabase
    .from('lesson_songs')
    .select('song_id, lessons!inner(teacher_id)')
    .eq('lessons.teacher_id', user.id);

  const teacherSongIds = [...new Set((lessonSongLinks ?? []).map((r) => r.song_id))];

  const { data: songRows } =
    teacherSongIds.length > 0
      ? await supabase
          .from('songs')
          .select('id, title, author, level')
          .in('id', teacherSongIds)
          .order('created_at', { ascending: false })
          .limit(10)
      : { data: [] };

  const songs: TeacherDashboardData['songs'] = (songRows ?? []).map((song) => ({
    id: song.id,
    title: song.title,
    artist: song.author,
    difficulty: DIFFICULTY_MAP[song.level] ?? 'Medium',
    duration: '',
    studentsLearning: 0,
  }));

  // ── Chart data ─────────────────────────────────────────────────────────────
  const chartData = buildWeekChartData(weekStart, weekLessons, weekAssignments);

  // ── Agenda (today's lessons, derived from allLessons + profiles map) ─────
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);
  const todayIso = today.toISOString();
  const tomorrowIso = tomorrow.toISOString();

  const profileNameById = new Map(profiles.map((p) => [p.id, p.full_name ?? 'Student']));
  const todayLessons = allLessons.filter(
    (l) => l.scheduled_at >= todayIso && l.scheduled_at < tomorrowIso
  );

  const agenda: TeacherDashboardData['agenda'] = [
    ...todayLessons.map((l) => {
      const studentName = profileNameById.get(l.student_id) ?? 'Student';
      return {
        id: l.id,
        type: 'lesson' as const,
        title: `Lesson with ${studentName}`,
        time: new Date(l.scheduled_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        studentName,
        status:
          new Date(l.scheduled_at) < new Date() ? ('completed' as const) : ('upcoming' as const),
      };
    }),
    ...displayAssignments
      .filter((a) => new Date(a.dueDate) <= tomorrow)
      .map((a) => ({
        id: a.id,
        type: 'assignment' as const,
        title: a.title,
        studentName: a.studentName,
        status: a.status === 'overdue' ? ('overdue' as const) : ('upcoming' as const),
      })),
  ];

  // ── Activities ─────────────────────────────────────────────────────────────
  const activities: TeacherDashboardData['activities'] = [
    ...todayLessons.slice(0, 3).map((l) => ({
      id: `act-l-${l.id}`,
      type: 'lesson_completed' as const,
      message: `Lesson with ${profileNameById.get(l.student_id) ?? 'Student'} scheduled`,
      time: new Date(l.scheduled_at).toLocaleTimeString(),
    })),
    ...((assignmentRows ?? []) as unknown as AssignmentRow[]).slice(0, 2).map((a) => ({
      id: `act-a-${a.id}`,
      type: 'assignment_submitted' as const,
      message: `Assignment "${a.title}" for ${a.profiles?.full_name ?? 'Student'}`,
      time: new Date(a.created_at ?? a.due_date).toLocaleTimeString(),
    })),
  ].sort((a, b) => b.time.localeCompare(a.time));

  // ── Stats ──────────────────────────────────────────────────────────────────
  const { count: pendingAssignmentsCount } = await supabase
    .from('assignments')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)
    .in('status', ['not_started', 'in_progress', 'pending']);

  // ── Weekly summary (all derived from already-fetched in-memory data) ──────
  const lessonsTaught = weekLessons.filter((l) => l.scheduled_at < now).length;
  const lessonsScheduled = weekLessons.filter((l) => l.scheduled_at >= now).length;
  const assignmentsCreatedThisWeek = weekAssignments.length;

  // Completed-this-week: derived from batched allAssignments using updated_at.
  // No extra query — relies on updated_at being present in the batch select above.
  const assignmentsCompletedThisWeek = allAssignments.filter(
    (a) => a.status === 'completed' && a.updated_at >= weekStart && a.updated_at < weekEnd
  ).length;

  const weeklySummary: TeacherDashboardData['weeklySummary'] = {
    lessonsTaught,
    lessonsScheduled,
    assignmentsCreated: assignmentsCreatedThisWeek,
    assignmentsCompleted: assignmentsCompletedThisWeek,
  };

  // ── Needs-attention (uses batched data, no per-student query) ─────────────
  const needsAttention: TeacherDashboardData['needsAttention'] = [];

  for (const student of students) {
    const attention = computeNeedsAttention(
      student.id,
      allLessons,
      student.overdueAssignmentCount,
      now
    );
    if (attention) {
      needsAttention.push({
        id: `attn-${student.id}`,
        studentId: student.id,
        studentName: student.name,
        reason: attention.reason,
        daysAgo: attention.daysAgo,
        actionUrl: `/dashboard/users/${student.id}`,
      });
    }
  }

  return {
    students,
    activities,
    chartData,
    songs,
    assignments: displayAssignments,
    agenda,
    stats: {
      totalStudents: students.length,
      songsInLibrary: teacherSongIds.length,
      lessonsThisWeek: weekLessons.length,
      pendingAssignments: pendingAssignmentsCount ?? 0,
    },
    weeklySummary,
    needsAttention,
  };
}
