import { transformLessonData } from '../utils';
import { applySortAndPagination as applySortAndPaginationBase } from '@/lib/database/query-helpers';
import { logger } from '@/lib/logger';
import type { LessonQueryParams, UserProfile, SupabaseClient } from './types';

function validateSortField(sort?: string): 'created_at' | 'date' | 'lesson_number' {
  const allowed = ['created_at', 'date', 'lesson_number'] as const;
  return (allowed as readonly string[]).includes(sort || '')
    ? (sort as 'created_at' | 'date' | 'lesson_number')
    : 'created_at';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyLessonFilters(query: any, params: LessonQueryParams) {
  let q = query;
  if (params.userId) q = q.or(`student_id.eq.${params.userId},teacher_id.eq.${params.userId}`);
  if (params.studentId) q = q.eq('student_id', params.studentId);
  if (params.filter && params.filter !== 'all') q = q.eq('status', params.filter.toUpperCase());
  return q;
}

function applySortAndPaginationWithGuards(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  sort: string,
  sortOrder: string,
  page: number,
  limit: number,
) {
  if (query && 'data' in query && 'error' in query && 'count' in query) return query;
  if (!query || typeof query.order !== 'function') {
    logger.error('applySortAndPagination received invalid query object');
    throw new Error('Invalid query object passed to applySortAndPagination');
  }
  return applySortAndPaginationBase(query, sort, sortOrder, page, limit);
}

export async function getLessonsHandler(
  supabase: SupabaseClient,
  user: { id: string } | null,
  profile: UserProfile | null,
  query: LessonQueryParams,
): Promise<{ lessons?: unknown[]; count?: number; status: number; error?: string }> {
  if (!user) return { error: 'Unauthorized', status: 401 };
  if (!profile) return { error: 'Profile not found', status: 404 };

  const {
    userId,
    studentId,
    filter,
    sort = 'created_at',
    sortOrder = 'desc',
    page = 1,
    limit = 50,
  } = query;

  const sortField = validateSortField(sort);
  const baseQuery = supabase
    .from('lessons')
    .select(
      `*, profile:profiles!lessons_student_id_fkey(id, full_name, email),
      teacher_profile:profiles!lessons_teacher_id_fkey(id, full_name, email),
      lesson_songs(song:songs(title)), assignments(title)`,
      { count: 'exact' },
    )
    .is('deleted_at', null);

  // Visibility (admin/teacher/student) enforced by RLS — see ADR-0001.
  const filteredQuery = applyLessonFilters(baseQuery, { userId, studentId, filter });
  const finalQuery = applySortAndPaginationWithGuards(filteredQuery, sortField, sortOrder, page, limit);

  if (finalQuery && 'data' in finalQuery && 'error' in finalQuery) {
    const { data, error, count } = finalQuery;
    if (error) return { error: error.message, status: 500 };
    return { lessons: (data || []).map(transformLessonData), count: count ?? 0, status: 200 };
  }

  const { data, error, count } = await finalQuery;
  if (error) return { error: error.message, status: 500 };
  return { lessons: (data || []).map(transformLessonData), count: count ?? 0, status: 200 };
}
