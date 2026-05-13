/**
 * Pure helpers for teacher dashboard data derivation.
 * All functions operate on already-fetched rows — no Supabase calls.
 */

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const DIFFICULTY_MAP: Record<string, 'Easy' | 'Medium' | 'Hard'> = {
  beginner: 'Easy',
  intermediate: 'Medium',
  advanced: 'Hard',
};

export function getLevelFromLessonCount(count: number): 'Beginner' | 'Intermediate' | 'Advanced' {
  if (count >= 20) return 'Advanced';
  if (count >= 5) return 'Intermediate';
  return 'Beginner';
}

/** Week bounds: Sunday midnight → next Sunday midnight (UTC). */
export function getWeekBounds(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - dayOfWeek);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { weekStart: start.toISOString(), weekEnd: end.toISOString() };
}

export interface LessonStub {
  id: string;
  student_id: string;
  scheduled_at: string;
}

export interface AssignmentStub {
  id: string;
  student_id: string;
  status: string;
  due_date: string;
  created_at: string;
}

export interface RepertoireStub {
  student_id: string;
}

/** Derive per-student lesson metrics from a batch of all lessons. */
export function buildStudentLessonMetrics(
  studentId: string,
  allLessons: LessonStub[],
  nowIso: string
): { lessonsCompleted: number; lastLessonAt: string | null; nextLessonAt: string | null } {
  const studentLessons = allLessons.filter((l) => l.student_id === studentId);
  const past = studentLessons
    .filter((l) => l.scheduled_at < nowIso)
    .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
  const future = studentLessons
    .filter((l) => l.scheduled_at >= nowIso)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  return {
    lessonsCompleted: past.length,
    lastLessonAt: past[0]?.scheduled_at ?? null,
    nextLessonAt: future[0]?.scheduled_at ?? null,
  };
}

/** Count overdue assignments per student from a batch. */
export function countOverdueAssignments(
  studentId: string,
  allAssignments: AssignmentStub[],
  nowIso: string
): number {
  return allAssignments.filter(
    (a) =>
      a.student_id === studentId &&
      a.status !== 'completed' &&
      a.status !== 'cancelled' &&
      a.due_date !== null &&
      a.due_date < nowIso
  ).length;
}

/** Count active repertoire entries per student. */
export function countRepertoire(studentId: string, allRepertoire: RepertoireStub[]): number {
  return allRepertoire.filter((r) => r.student_id === studentId).length;
}

/** Build the Sun–Sat chart array for lessons + assignmentsCreated. */
export function buildWeekChartData(
  weekStart: string,
  allLessons: { scheduled_at: string }[],
  allAssignments: { created_at: string }[]
): { name: string; lessons: number; assignmentsCreated: number }[] {
  const lessonsByDay = new Map<number, number>();
  for (const l of allLessons) {
    const day = new Date(l.scheduled_at).getUTCDay();
    lessonsByDay.set(day, (lessonsByDay.get(day) ?? 0) + 1);
  }
  const assignsByDay = new Map<number, number>();
  for (const a of allAssignments) {
    const day = new Date(a.created_at).getUTCDay();
    assignsByDay.set(day, (assignsByDay.get(day) ?? 0) + 1);
  }

  return DAY_NAMES.map((name, index) => ({
    name,
    lessons: lessonsByDay.get(index) ?? 0,
    assignmentsCreated: assignsByDay.get(index) ?? 0,
  }));
}

/**
 * Determine whether a student needs attention.
 * Returns a reason and daysAgo, or null if student is fine.
 */
export function computeNeedsAttention(
  studentId: string,
  allLessons: LessonStub[],
  overdueCount: number,
  nowIso: string
): { reason: 'no_recent_lesson' | 'overdue_assignment' | 'inactive'; daysAgo: number } | null {
  if (overdueCount > 0) {
    return { reason: 'overdue_assignment', daysAgo: 1 };
  }

  const past = allLessons
    .filter((l) => l.student_id === studentId && l.scheduled_at < nowIso)
    .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));

  if (past.length === 0) return null;

  const daysSince = Math.floor(
    (new Date(nowIso).getTime() - new Date(past[0].scheduled_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince >= 14) {
    return {
      reason: daysSince >= 30 ? 'inactive' : 'no_recent_lesson',
      daysAgo: daysSince,
    };
  }

  return null;
}
