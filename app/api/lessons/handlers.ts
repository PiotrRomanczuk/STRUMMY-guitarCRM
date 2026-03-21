// Pure functions for lesson API business logic - testable without Next.js dependencies
import { LessonInputSchema } from '../../../schemas/LessonSchema';
import { ZodError } from 'zod';
import {
  transformLessonData,
  prepareLessonForDb,
  addSongsToLesson,
  insertLessonRecord,
} from './utils';
import {
  syncLessonCreation,
  syncLessonUpdate,
  syncLessonDeletion,
} from '../../../lib/services/calendar-lesson-sync';
import { validateMutationPermission } from '@/lib/auth/permissions';
import { applySortAndPagination as applySortAndPaginationBase } from '@/lib/database/query-helpers';

// Re-export so existing imports from this module continue to work
export { validateMutationPermission } from '@/lib/auth/permissions';

export interface LessonQueryParams {
  userId?: string;
  studentId?: string;
  filter?: string; // status
  sort?: 'created_at' | 'date' | 'lesson_number';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface LessonError {
  error: string;
  status: number;
}

export interface UserProfile {
  isAdmin: boolean;
  isTeacher: boolean | null;
  isStudent: boolean | null;
}

export function canViewAll(profile: UserProfile | null): boolean {
  return !!profile?.isAdmin;
}

function validateSortField(sort?: string): 'created_at' | 'date' | 'lesson_number' {
  const allowed = ['created_at', 'date', 'lesson_number'] as const;
  return (allowed as readonly string[]).includes(sort || '')
    ? (sort as 'created_at' | 'date' | 'lesson_number')
    : 'created_at';
}

// Helper types for query building
type SupabaseClient = Awaited<
  ReturnType<typeof import('../../../lib/supabase/server').createClient>
>;

/**
 * Get teacher's student IDs from active (non-deleted) lessons only
 */
async function getTeacherStudentIds(
  supabase: SupabaseClient,
  teacherId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('lessons')
    .select('student_id')
    .eq('teacher_id', teacherId)
    .is('deleted_at', null);

  const studentIds = data?.map((l) => l.student_id) || [];
  const uniqueStudentIds = Array.from(new Set(studentIds));
  return uniqueStudentIds;
}

/**
 * Apply role-based filtering to lessons query
 */
async function applyRoleBasedFiltering(
  supabase: SupabaseClient,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dbQuery: any,
  user: { id: string },
  profile: UserProfile,
  params: LessonQueryParams
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ query: any } | { lessons: []; count: number; status: number }> {
  if (!profile) {
    logger.error('applyRoleBasedFiltering called with null profile');
    return { lessons: [], count: 0, status: 500 };
  }

  if (canViewAll(profile)) {
    // Admin sees all lessons
    return { query: applyLessonFilters(dbQuery, params) };
  }

  if (profile.isTeacher) {
    // Teacher sees only their students' lessons
    const studentIds = await getTeacherStudentIds(supabase, user.id);
    if (studentIds.length === 0) {
      return { lessons: [], count: 0, status: 200 };
    }
    const filteredQuery = dbQuery.in('student_id', studentIds);
    return {
      query: applyLessonFilters(filteredQuery, {
        filter: params.filter,
        studentId: params.studentId,
      }),
    };
  }

  // Student sees only their own lessons
  const studentQuery = dbQuery.eq('student_id', user.id);
  return { query: applyLessonFilters(studentQuery, { filter: params.filter }) };
}

function applyLessonFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  params: LessonQueryParams
) {
  let q = query;
  if (params.userId) {
    q = q.or(`student_id.eq.${params.userId},teacher_id.eq.${params.userId}`);
  }
  if (params.studentId) {
    q = q.eq('student_id', params.studentId);
  }
  if (params.filter && params.filter !== 'all') {
    q = q.eq('status', params.filter.toUpperCase());
  }
  return q;
}

function applySortAndPaginationWithGuards(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  sort: string,
  sortOrder: string,
  page: number,
  limit: number
) {
  // If we received an already-executed query result, just return it
  if (query && 'data' in query && 'error' in query && 'count' in query) {
    return query;
  }

  if (!query || typeof query.order !== 'function') {
    logger.error('applySortAndPagination received invalid query object');
    throw new Error('Invalid query object passed to applySortAndPagination');
  }

  return applySortAndPaginationBase(query, sort, sortOrder, page, limit);
}

// Complexity is slightly over due to role-based filtering logic
export async function getLessonsHandler(
  supabase: SupabaseClient,
  user: { id: string } | null,
  profile: UserProfile | null,
  query: LessonQueryParams
): Promise<{
  lessons?: unknown[];
  count?: number;
  status: number;
  error?: string;
}> {
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (!profile) {
    return { error: 'Profile not found', status: 404 };
  }

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
  const baseQuery = supabase.from('lessons').select(
    `
      *,
      profile:profiles!lessons_student_id_fkey(id, full_name, email),
      teacher_profile:profiles!lessons_teacher_id_fkey(id, full_name, email),
      lesson_songs(
        song:songs(title)
      ),
      assignments(title)
    `,
    { count: 'exact' }
  ).is('deleted_at', null);

  // Apply role-based filtering
  const filteringResult = await applyRoleBasedFiltering(supabase, baseQuery, user, profile, {
    userId,
    studentId,
    filter,
  });

  // Check if early return (teacher with no students)
  if ('lessons' in filteringResult) {
    return filteringResult;
  }

  const filteredQuery = filteringResult.query;

  const finalQuery = applySortAndPaginationWithGuards(filteredQuery, sortField, sortOrder, page, limit);

  // If finalQuery is already an executed result, handle it directly
  if (finalQuery && 'data' in finalQuery && 'error' in finalQuery) {
    const { data, error, count } = finalQuery;
    if (error) {
      return { error: error.message, status: 500 };
    }
    const lessons = (data || []).map(transformLessonData);
    return { lessons, count: count ?? 0, status: 200 };
  }

  // Otherwise, execute the query
  const { data, error, count } = await finalQuery;
  if (error) {
    return { error: error.message, status: 500 };
  }
  const lessons = (data || []).map(transformLessonData);
  return { lessons, count: count ?? 0, status: 200 };
}

export async function createLessonHandler(
  supabase: SupabaseClient,
  user: { id: string } | null,
  profile: UserProfile | null,
  body: unknown
): Promise<{ lesson?: unknown; status: number; error?: string }> {
  if (!user) return { error: 'Unauthorized', status: 401 };
  if (!profile) return { error: 'Profile not found', status: 404 };

  if (!validateMutationPermission(profile)) {
    return {
      error: 'Only admins and teachers can create lessons',
      status: 403,
    };
  }

  try {
    const validatedData = LessonInputSchema.parse(body);
    const { song_ids, ...lessonData } = validatedData;

    // Validate that teacher_id references an existing teacher
    if (lessonData.teacher_id) {
      const { data: teacher, error: teacherError } = await supabase
        .from('profiles')
        .select('id, is_teacher')
        .eq('id', lessonData.teacher_id)
        .single();

      if (teacherError || !teacher) {
        return { error: 'Teacher not found', status: 400 };
      }
      if (!teacher.is_teacher && !profile?.isAdmin) {
        return { error: 'Specified user is not a teacher', status: 400 };
      }

      // Non-admin teachers can only create lessons for themselves
      if (!profile?.isAdmin && lessonData.teacher_id !== user!.id) {
        return { error: 'Teachers can only create lessons for themselves', status: 403 };
      }
    }

    // Validate that student_id references an existing student
    if (lessonData.student_id) {
      const { data: student, error: studentError } = await supabase
        .from('profiles')
        .select('id, is_student')
        .eq('id', lessonData.student_id)
        .single();

      if (studentError || !student) {
        return { error: 'Student not found', status: 400 };
      }
      if (!student.is_student) {
        return { error: 'Specified user is not a student', status: 400 };
      }
    }

    const { data, error } = await insertLessonRecord(supabase, lessonData);

    if (error) {
      logger.error('Supabase insert error:', error);
      return { error: error.message, status: 500 };
    }

    if (song_ids && song_ids.length > 0) {
      await addSongsToLesson(supabase, data.id, song_ids);
    }

    // Sync to Google Calendar (non-blocking, errors are logged)
    await syncLessonCreation(supabase, data);

    return { lesson: data, status: 201 };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        error: `Validation error: ${error.issues.map((e) => e.message).join(', ')}`,
        status: 400,
      };
    }
    return { error: 'Internal server error', status: 500 };
  }
}

import { handleLessonSongsUpdate } from './utils';
import { logger } from '@/lib/logger';

export async function updateLessonHandler(
  supabase: SupabaseClient,
  user: { id: string } | null,
  profile: UserProfile | null,
  id: string,
  body: unknown
): Promise<{ lesson?: unknown; status: number; error?: string }> {
  if (!user) return { error: 'Unauthorized', status: 401 };
  if (!profile) return { error: 'Profile not found', status: 404 };

  if (!validateMutationPermission(profile)) {
    return {
      error: 'Only admins and teachers can update lessons',
      status: 403,
    };
  }

  try {
    const validatedData = LessonInputSchema.partial().parse(body);
    const { song_ids, ...lessonData } = validatedData;

    const dbData = prepareLessonForDb(lessonData);

    //  Build update object with only defined, allowed fields
    // Filter to prevent Supabase JSONB operator errors
    const allowedUpdateFields = ['student_id', 'teacher_id', 'title', 'notes', 'scheduled_at', 'status'];
    const updateData = Object.keys(dbData)
      .filter(key => allowedUpdateFields.includes(key) && dbData[key] !== undefined)
      .reduce((obj, key) => {
        obj[key] = dbData[key];
        return obj;
      }, {} as Record<string, unknown>);

    let data;
    if (Object.keys(updateData).length > 0) {
      const result = await supabase.from('lessons').update(updateData).eq('id', id).select().single();

      if (result.error) {
        if (result.error.code === 'PGRST116') {
          return { error: 'Lesson not found', status: 404 };
        }
        return { error: result.error.message, status: 500 };
      }
      data = result.data;
    } else {
      // If no lesson data to update, just fetch the lesson to get student_id for song update
      const result = await supabase.from('lessons').select().eq('id', id).single();

      if (result.error) {
        if (result.error.code === 'PGRST116') {
          return { error: 'Lesson not found', status: 404 };
        }
        return { error: result.error.message, status: 500 };
      }
      data = result.data;
    }

    // Handle song updates if song_ids is provided
    if (song_ids) {
      await handleLessonSongsUpdate(supabase, id, song_ids);
    }

    // Sync to Google Calendar if relevant fields changed
    if (updateData.title || updateData.scheduled_at || updateData.notes !== undefined) {
      await syncLessonUpdate(supabase, data, {
        title: updateData.title as string | undefined,
        scheduled_at: updateData.scheduled_at as string | undefined,
        notes: updateData.notes as string | null | undefined,
      });
    }

    // Lesson recap email is handled by DB trigger (tr_notify_lesson_completed)
    // which queues it with a 30-minute delay for deduplication with manual sends

    return { lesson: data, status: 200 };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        error: `Validation error: ${error.issues.map((e) => e.message).join(', ')}`,
        status: 400,
      };
    }
    return { error: 'Internal server error', status: 500 };
  }
}

export async function deleteLessonHandler(
  supabase: SupabaseClient,
  user: { id: string } | null,
  profile: UserProfile | null,
  id: string
): Promise<{ status: number; error?: string }> {
  if (!user) return { error: 'Unauthorized', status: 401 };
  if (!profile) return { error: 'Profile not found', status: 404 };

  if (!validateMutationPermission(profile)) {
    return {
      error: 'Only admins and teachers can delete lessons',
      status: 403,
    };
  }

  // Sync deletion to Google Calendar before soft-deleting from DB
  await syncLessonDeletion(supabase, id);

  const { error } = await supabase
    .from('lessons')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return { error: error.message, status: 500 };
  }

  return { status: 200 };
}
