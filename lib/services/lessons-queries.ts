import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type LessonRow = {
  id: string;
  /** Per-teacher sequential number (`lessons.lesson_teacher_number`). */
  lessonNumber: number;
  scheduledAt: string;
  status: string;
  title: string | null;
  teacherId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  teacherName: string | null;
  teacherEmail: string | null;
  /** Number of songs attached to the lesson via `lesson_songs`. */
  songCount: number;
  /** Per-song `lesson_songs.status`, for the progress dots (unbounded — UI slices). */
  songStatuses: string[];
};

/**
 * Who is looking at the lessons list. Admins see every teacher's lessons;
 * teachers see the ones they teach; students see the ones they attend.
 */
export type LessonViewer = {
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLOURS: Record<string, string> = {
  SCHEDULED: 'var(--info)',
  IN_PROGRESS: 'var(--gold-2)',
  COMPLETED: 'var(--success)',
  CANCELLED: 'var(--ink-4)',
  scheduled: 'var(--info)',
  in_progress: 'var(--gold-2)',
  completed: 'var(--success)',
  cancelled: 'var(--ink-4)',
};

export const lessonStatusLabel = (status: string): string => STATUS_LABELS[status] ?? status;
export const lessonStatusColour = (status: string): string =>
  STATUS_COLOURS[status] ?? 'var(--ink-4)';

/** Editorial-token colours for each `lesson_songs.status`, used by the progress dots. */
const SONG_STATUS_COLOURS: Record<string, string> = {
  to_learn: 'var(--ink-4)',
  started: 'var(--info)',
  remembered: 'var(--warn)',
  with_author: '#7a6aa0',
  mastered: 'var(--success)',
};

export const songStatusColour = (status: string): string =>
  SONG_STATUS_COLOURS[status] ?? 'var(--ink-4)';

export type LessonsFilters = {
  statuses?: string[];
  sort?: 'newest' | 'oldest';
  /** Calendar year of `scheduled_at` (UTC) to restrict to. */
  year?: number;
};

const LESSON_SELECT =
  'id, lesson_teacher_number, scheduled_at, status, title, teacher_id, student_id, student:profiles!lessons_student_id_fkey(id, full_name, email), teacher:profiles!lessons_teacher_id_fkey(id, full_name, email), lesson_songs(status)';

type RawLessonRow = Record<string, unknown> & {
  student?:
    { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null;
  teacher?:
    { full_name?: string; email?: string } | { full_name?: string; email?: string }[] | null;
  lesson_songs?: { status?: string | null }[] | null;
};

const mapLessonRow = (row: RawLessonRow): LessonRow => {
  const student = Array.isArray(row.student) ? row.student[0] : row.student;
  const teacher = Array.isArray(row.teacher) ? row.teacher[0] : row.teacher;
  const songs = Array.isArray(row.lesson_songs) ? row.lesson_songs : [];
  return {
    id: row.id as string,
    lessonNumber: (row.lesson_teacher_number as number | null) ?? 0,
    scheduledAt: row.scheduled_at as string,
    status: row.status as string,
    title: (row.title as string | null) ?? null,
    teacherId: row.teacher_id as string,
    studentId: row.student_id as string,
    studentName: student?.full_name ?? null,
    studentEmail: student?.email ?? null,
    teacherName: teacher?.full_name ?? null,
    teacherEmail: teacher?.email ?? null,
    songCount: songs.length,
    songStatuses: songs.map((s) => s?.status ?? 'to_learn'),
  };
};

/** Column a non-admin viewer is scoped to (null = admin, sees every lesson). */
const scopeColumn = (viewer: LessonViewer): 'teacher_id' | 'student_id' | null =>
  viewer.isAdmin ? null : viewer.isTeacher ? 'teacher_id' : 'student_id';

export async function getRecentLessons(
  userId: string,
  viewer: LessonViewer,
  filters: LessonsFilters = {},
  limit = 60
): Promise<LessonRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from('lessons')
    .select(LESSON_SELECT)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: filters.sort === 'oldest' });

  const ownerColumn = scopeColumn(viewer);
  if (ownerColumn) query = query.eq(ownerColumn, userId);

  if (filters.statuses && filters.statuses.length > 0) {
    query = query.in('status', filters.statuses);
  }

  if (filters.year !== undefined) {
    const start = `${filters.year}-01-01T00:00:00.000Z`;
    const end = `${filters.year + 1}-01-01T00:00:00.000Z`;
    query = query.gte('scheduled_at', start).lt('scheduled_at', end);
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    logger.warn('[lessons-queries] recent lessons error', {
      error: error.message,
      code: error.code,
    });
    return [];
  }

  return (data ?? []).map((row) => mapLessonRow(row as RawLessonRow));
}

/**
 * Lessons whose `scheduled_at` falls within [startISO, endISO). Role-scoped like
 * getRecentLessons. Used by the calendar month grid, so ordered soonest-first.
 */
export async function getLessonsInRange(
  userId: string,
  viewer: LessonViewer,
  startISO: string,
  endISO: string,
  limit = 500
): Promise<LessonRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from('lessons')
    .select(LESSON_SELECT)
    .is('deleted_at', null)
    .gte('scheduled_at', startISO)
    .lt('scheduled_at', endISO)
    .order('scheduled_at', { ascending: true });

  const ownerColumn = scopeColumn(viewer);
  if (ownerColumn) query = query.eq(ownerColumn, userId);

  const { data, error } = await query.limit(limit);

  if (error) {
    logger.warn('[lessons-queries] lessons in range error', {
      error: error.message,
      code: error.code,
    });
    return [];
  }

  return (data ?? []).map((row) => mapLessonRow(row as RawLessonRow));
}

export type LessonsBreakdown = {
  total: number;
  byStatus: Record<string, number>;
};

export const summariseLessons = (lessons: LessonRow[]): LessonsBreakdown => {
  const byStatus: Record<string, number> = {};
  for (const l of lessons) {
    const key = l.status.toLowerCase();
    byStatus[key] = (byStatus[key] ?? 0) + 1;
  }
  return { total: lessons.length, byStatus };
};
