import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export type AssignmentRow = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  teacherId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started',
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const STATUS_COLOURS: Record<string, string> = {
  not_started: 'var(--ink-4)',
  pending: 'var(--info)',
  in_progress: 'var(--gold-2)',
  completed: 'var(--success)',
  overdue: 'var(--danger)',
  cancelled: 'var(--ink-4)',
};

export const assignmentStatusLabel = (s: string): string => STATUS_LABELS[s] ?? s;
export const assignmentStatusColour = (s: string): string => STATUS_COLOURS[s] ?? 'var(--ink-4)';

export async function getAssignments(
  userId: string,
  asStudent: boolean,
  limit = 60
): Promise<AssignmentRow[]> {
  const supabase = await createClient();
  const filter = asStudent ? 'student_id' : 'teacher_id';
  const { data, error } = await supabase
    .from('assignments')
    .select(
      'id, title, status, due_date, teacher_id, student_id, created_at, student:profiles!assignments_student_id_fkey(full_name, email)'
    )
    .eq(filter, userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn('[assignments-queries] error', { error: error.message, code: error.code });
    return [];
  }

  return (data ?? []).map((row) => {
    const student = Array.isArray(row.student) ? row.student[0] : row.student;
    return {
      id: row.id as string,
      title: row.title as string,
      status: row.status as string,
      dueDate: (row.due_date as string) ?? null,
      teacherId: row.teacher_id as string,
      studentId: row.student_id as string,
      studentName: (student?.full_name as string) ?? null,
      studentEmail: (student?.email as string) ?? null,
      createdAt: row.created_at as string,
    };
  });
}

export const countAssignmentsByStatus = (rows: AssignmentRow[]): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const r of rows) map[r.status] = (map[r.status] ?? 0) + 1;
  return map;
};
