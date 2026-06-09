import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type LessonRow = {
  id: string;
  scheduledAt: string;
  status: string;
  title: string | null;
  teacherId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
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

export type LessonsFilters = {
  statuses?: string[];
  sort?: 'newest' | 'oldest';
};

export async function getRecentLessons(
  userId: string,
  isStudent: boolean,
  filters: LessonsFilters = {},
  limit = 60
): Promise<LessonRow[]> {
  const supabase = await createClient();

  const filterColumn = isStudent ? 'student_id' : 'teacher_id';
  let query = supabase
    .from('lessons')
    .select(
      'id, scheduled_at, status, title, teacher_id, student_id, student:profiles!lessons_student_id_fkey(id, full_name, email)'
    )
    .eq(filterColumn, userId)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: filters.sort === 'oldest' });

  if (filters.statuses && filters.statuses.length > 0) {
    query = query.in('status', filters.statuses);
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    logger.warn('[lessons-queries] recent lessons error', {
      error: error.message,
      code: error.code,
    });
    return [];
  }

  return (data ?? []).map((row) => {
    const student = Array.isArray(row.student) ? row.student[0] : row.student;
    return {
      id: row.id as string,
      scheduledAt: row.scheduled_at as string,
      status: row.status as string,
      title: row.title as string | null,
      teacherId: row.teacher_id as string,
      studentId: row.student_id as string,
      studentName: (student?.full_name as string) ?? null,
      studentEmail: (student?.email as string) ?? null,
    };
  });
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
