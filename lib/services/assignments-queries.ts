import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import {
  buildAssignmentListResult,
  deriveEffectiveStatus,
  emptyAssignmentCounts,
  type AssignmentListParams,
  type AssignmentListResult,
  type AssignmentRow,
} from '@/lib/services/assignment-list-params';

export type {
  AssignmentRow,
  AssignmentListCounts,
  AssignmentListParams,
  AssignmentListResult,
  AssignmentSortField,
} from '@/lib/services/assignment-list-params';
export { parseAssignmentListParams } from '@/lib/services/assignment-list-params';

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const STATUS_COLOURS: Record<string, string> = {
  not_started: 'var(--ink-4)',
  in_progress: 'var(--gold-2)',
  completed: 'var(--success)',
  overdue: 'var(--danger)',
  cancelled: 'var(--ink-4)',
};

export const assignmentStatusLabel = (s: string): string => STATUS_LABELS[s] ?? s;
export const assignmentStatusColour = (s: string): string => STATUS_COLOURS[s] ?? 'var(--ink-4)';

type RawAssignment = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  teacher_id: string;
  student_id: string;
  created_at: string;
  updated_at: string | null;
  student:
    | { full_name: string | null; email: string | null }
    | { full_name: string | null; email: string | null }[]
    | null;
};

const mapRow = (row: RawAssignment): AssignmentRow => {
  const student = Array.isArray(row.student) ? row.student[0] : row.student;
  const dueDate = row.due_date ?? null;
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    effectiveStatus: deriveEffectiveStatus(dueDate, row.status),
    dueDate,
    teacherId: row.teacher_id,
    studentId: row.student_id,
    studentName: student?.full_name ?? null,
    studentEmail: student?.email ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
};

/**
 * Role-scoped assignments list with filtering, effective-status counts, and
 * ordering. Because RLS already bounds the set to the caller's own rows (tens–
 * low hundreds), the whole set is fetched once (cap 500) and all status logic
 * runs in JS over `effectiveStatus`, keeping counts/tabs/sort mutually
 * consistent. Past ~500 live rows, push the overdue predicate into SQL.
 */
export async function getAssignmentsList(
  userId: string,
  asStudent: boolean,
  params: AssignmentListParams
): Promise<AssignmentListResult> {
  const supabase = await createClient();
  let query = supabase
    .from('assignments')
    .select(
      'id, title, status, due_date, teacher_id, student_id, created_at, updated_at, student:profiles!assignments_student_id_fkey(full_name, email)'
    )
    .eq(asStudent ? 'student_id' : 'teacher_id', userId)
    .is('deleted_at', null);

  if (!asStudent && params.studentId) query = query.eq('student_id', params.studentId);
  if (params.search) query = query.ilike('title', `%${params.search}%`);

  const { data, error } = await query.limit(500);

  if (error) {
    logger.warn('[assignments-queries] list error', { error: error.message, code: error.code });
    return { rows: [], counts: emptyAssignmentCounts() };
  }

  const rows = (data ?? []).map((row) => mapRow(row as unknown as RawAssignment));
  return buildAssignmentListResult(rows, params);
}
