import {
  AssignmentStatusEnum,
  calculateAssignmentStatus,
  type AssignmentStatus,
} from '@/schemas/AssignmentSchema';

/**
 * Pure (Supabase-free) helpers for the assignments list: parsing the URL
 * searchParams into a typed filter/sort struct, and deriving counts + ordering
 * from already-fetched rows. `effectiveStatus` is the single source of truth for
 * "overdue" — computed at read time via `calculateAssignmentStatus`, never the
 * raw column (see docs/app-blueprint/06-assignments.md).
 */

export type AssignmentRow = {
  id: string;
  title: string;
  status: string; // raw persisted status
  effectiveStatus: AssignmentStatus; // derived (overdue computed at read time)
  dueDate: string | null;
  teacherId: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  createdAt: string;
  updatedAt: string;
  progress: { done: number; total: number };
};

export type AssignmentListCounts = {
  all: number;
  not_started: number;
  in_progress: number;
  completed: number;
  overdue: number;
  cancelled: number;
};

export const SORT_FIELDS = ['due_date', 'created_at', 'updated_at', 'title', 'status'] as const;
export type AssignmentSortField = (typeof SORT_FIELDS)[number];

export type AssignmentListParams = {
  status?: AssignmentStatus; // tab filter over effective status; absent = All
  studentId?: string; // teacher/admin only
  search?: string; // title ilike
  sort?: AssignmentSortField; // absent = needs-attention default ordering
  dir: 'asc' | 'desc';
};

export type AssignmentListResult = {
  rows: AssignmentRow[];
  counts: AssignmentListCounts;
};

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

/** Parse URL searchParams into a validated struct; invalid values fall back to defaults (never throws). */
export function parseAssignmentListParams(
  searchParams: Record<string, string | string[] | undefined>
): AssignmentListParams {
  const statusParsed = AssignmentStatusEnum.safeParse(first(searchParams.status));
  const sortRaw = first(searchParams.sort);
  const sort = (SORT_FIELDS as readonly string[]).includes(sortRaw ?? '')
    ? (sortRaw as AssignmentSortField)
    : undefined;
  return {
    status: statusParsed.success ? statusParsed.data : undefined,
    studentId: first(searchParams.student)?.trim() || undefined,
    search: first(searchParams.q)?.trim() || undefined,
    sort,
    dir: first(searchParams.dir) === 'desc' ? 'desc' : 'asc',
  };
}

export const emptyAssignmentCounts = (): AssignmentListCounts => ({
  all: 0,
  not_started: 0,
  in_progress: 0,
  completed: 0,
  overdue: 0,
  cancelled: 0,
});

/** Tally by effective status across the WHOLE set (before tab filtering) so tab badges stay stable. */
export const tallyAssignmentCounts = (rows: AssignmentRow[]): AssignmentListCounts => {
  const counts = emptyAssignmentCounts();
  counts.all = rows.length;
  for (const r of rows) counts[r.effectiveStatus] += 1;
  return counts;
};

// Needs-attention ordering weight: overdue first, then active, then closed.
const STATUS_ORDER: Record<string, number> = {
  overdue: 0,
  not_started: 1,
  in_progress: 2,
  completed: 3,
  cancelled: 4,
};

const dueMs = (iso: string | null): number => (iso ? Date.parse(iso) : Number.POSITIVE_INFINITY);

const compareBy = (a: AssignmentRow, b: AssignmentRow, field: AssignmentSortField): number => {
  switch (field) {
    case 'title':
      return a.title.localeCompare(b.title);
    case 'status':
      return (STATUS_ORDER[a.effectiveStatus] ?? 9) - (STATUS_ORDER[b.effectiveStatus] ?? 9);
    case 'created_at':
      return Date.parse(a.createdAt) - Date.parse(b.createdAt);
    case 'updated_at':
      return Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
    case 'due_date':
      return dueMs(a.dueDate) - dueMs(b.dueDate);
  }
};

/** Default "needs attention": overdue first, then soonest due (nulls last), then newest. */
const compareNeedsAttention = (a: AssignmentRow, b: AssignmentRow): number => {
  const ao = a.effectiveStatus === 'overdue' ? 0 : 1;
  const bo = b.effectiveStatus === 'overdue' ? 0 : 1;
  if (ao !== bo) return ao - bo;
  const dd = dueMs(a.dueDate) - dueMs(b.dueDate);
  if (dd !== 0) return dd;
  return Date.parse(b.createdAt) - Date.parse(a.createdAt);
};

export const sortAssignments = (
  rows: AssignmentRow[],
  params: AssignmentListParams
): AssignmentRow[] => {
  const copy = [...rows];
  if (!params.sort) return copy.sort(compareNeedsAttention);
  const factor = params.dir === 'desc' ? -1 : 1;
  return copy.sort((a, b) => factor * compareBy(a, b, params.sort!));
};

/** Compose the list result: counts over all, tab-filter by effective status, then sort. */
export const buildAssignmentListResult = (
  rows: AssignmentRow[],
  params: AssignmentListParams
): AssignmentListResult => {
  const counts = tallyAssignmentCounts(rows);
  const filtered = params.status ? rows.filter((r) => r.effectiveStatus === params.status) : rows;
  return { rows: sortAssignments(filtered, params), counts };
};

/** Re-derive effective status (overdue computed from due_date) for a raw persisted row. */
export const deriveEffectiveStatus = (dueDate: string | null, status: string): AssignmentStatus =>
  calculateAssignmentStatus(dueDate, status as AssignmentStatus);
