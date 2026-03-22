import { AssignmentFilterSchema, AssignmentSortSchema } from '@/schemas/AssignmentSchema';
import type { SupabaseClient } from '@supabase/supabase-js';
import { queueNotification } from '@/lib/services/notification-service';
import { logger } from '@/lib/logger';

/**
 * Assignment API Handlers
 * Business logic separated from route handlers for better testability and maintainability
 */

type Profile = {
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
};

type QueryParams = {
  teacher_id?: string;
  student_id?: string;
  lesson_id?: string;
  song_id?: string;
  status?: string;
  search?: string;
  due_date_from?: string;
  due_date_to?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
};

type AssignmentInput = {
  title: string;
  description?: string;
  due_date?: string;
  teacher_id: string;
  student_id: string;
  lesson_id?: string | null;
  song_id?: string | null;
  status?: string;
};

/**
 * Build base query with role-based filters
 */
function buildAssignmentQuery(supabase: SupabaseClient, userId: string, profile: Profile) {
  let query = supabase.from('assignments').select(`
      *,
      teacher_profile:profiles!assignments_teacher_id_fkey(id, email, full_name),
      student_profile:profiles!assignments_student_id_fkey(id, email, full_name),
      lesson:lessons(id, lesson_teacher_number, scheduled_at),
      song:songs(id, title, author)
    `);

  // Exclude soft-deleted assignments
  query = query.is('deleted_at', null);

  // Apply role-based filters
  if (profile.isAdmin) return query; // Admins see all
  if (profile.isTeacher) return query.eq('teacher_id', userId);
  if (profile.isStudent) return query.eq('student_id', userId);

  return query.eq('id', '00000000-0000-0000-0000-000000000000'); // No access
}

/**
 * Apply additional filters to query
 */
function applyFilters(query: ReturnType<typeof buildAssignmentQuery>, filters: Record<string, string | undefined>) {
  let result = query;

  if (filters.teacher_id) result = result.eq('teacher_id', filters.teacher_id);
  if (filters.student_id) result = result.eq('student_id', filters.student_id);
  if (filters.lesson_id) result = result.eq('lesson_id', filters.lesson_id);
  if (filters.song_id) result = result.eq('song_id', filters.song_id);
  if (filters.status) result = result.eq('status', filters.status);
  if (filters.search) {
    result = result.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }
  if (filters.due_date_from) result = result.gte('due_date', filters.due_date_from);
  if (filters.due_date_to) result = result.lte('due_date', filters.due_date_to);

  return result;
}

/**
 * GET handler - Fetch assignments with role-based filtering
 */
export async function getAssignmentsHandler(
  supabase: SupabaseClient,
  userId: string,
  profile: Profile,
  queryParams: QueryParams
) {
  try {
    const filters = AssignmentFilterSchema.parse({
      teacher_id: queryParams.teacher_id,
      student_id: queryParams.student_id,
      lesson_id: queryParams.lesson_id,
      song_id: queryParams.song_id,
      status: queryParams.status,
      search: queryParams.search,
      due_date_from: queryParams.due_date_from,
      due_date_to: queryParams.due_date_to,
    });

    const sort = AssignmentSortSchema.parse({
      field: queryParams.sortField || 'created_at',
      direction: queryParams.sortDirection || 'desc',
    });

    let query = buildAssignmentQuery(supabase, userId, profile);
    query = applyFilters(query, filters);
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });

    const { data: assignments, error } = await query;

    if (error) {
      logger.error('Error fetching assignments:', error);
      return { error: 'Failed to fetch assignments', status: 500 };
    }

    return { assignments, status: 200 };
  } catch (error) {
    logger.error('Error in getAssignmentsHandler:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * Verify student is valid for assignment
 */
async function verifyStudent(supabase: SupabaseClient, studentId: string) {
  const { data: studentProfile, error } = await supabase
    .from('profiles')
    .select('id, is_student')
    .eq('id', studentId)
    .single();

  if (error || !studentProfile) {
    return { valid: false, error: 'Student not found' };
  }

  if (!studentProfile.is_student) {
    return { valid: false, error: 'Specified user is not a student' };
  }

  return { valid: true };
}

/**
 * Verify lesson matches teacher and student
 */
async function verifyLesson(
  supabase: SupabaseClient,
  lessonId: string,
  teacherId: string,
  studentId: string
) {
  const { data: lesson, error } = await supabase
    .from('lessons')
    .select('id, teacher_id, student_id')
    .eq('id', lessonId)
    .single();

  if (error || !lesson) {
    return { valid: false, error: 'Lesson not found' };
  }

  if (lesson.teacher_id !== teacherId || lesson.student_id !== studentId) {
    return { valid: false, error: 'Lesson does not match specified teacher and student' };
  }

  return { valid: true };
}

/**
 * Check if user can create assignment
 */
function checkCreatePermissions(profile: Profile, userId: string, teacherId: string) {
  if (!profile.isAdmin && !profile.isTeacher) {
    return { allowed: false, error: 'Only teachers and admins can create assignments' };
  }

  if (!profile.isAdmin && teacherId !== userId) {
    return { allowed: false, error: 'Teachers can only create assignments for themselves' };
  }

  return { allowed: true };
}

/**
 * POST handler - Create new assignment
 */
export async function createAssignmentHandler(
  supabase: SupabaseClient,
  userId: string,
  profile: Profile,
  input: AssignmentInput
) {
  try {
    // Check permissions
    const permissionCheck = checkCreatePermissions(profile, userId, input.teacher_id);
    if (!permissionCheck.allowed) {
      return { error: permissionCheck.error, status: 403 };
    }

    // Verify student
    const studentCheck = await verifyStudent(supabase, input.student_id);
    if (!studentCheck.valid) {
      return { error: studentCheck.error, status: 400 };
    }

    // Verify lesson if provided
    if (input.lesson_id) {
      const lessonCheck = await verifyLesson(
        supabase,
        input.lesson_id,
        input.teacher_id,
        input.student_id
      );
      if (!lessonCheck.valid) {
        return { error: lessonCheck.error, status: 400 };
      }
    }

    // Create assignment
    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({
        title: input.title,
        description: input.description,
        due_date: input.due_date,
        teacher_id: input.teacher_id,
        student_id: input.student_id,
        lesson_id: input.lesson_id,
        song_id: input.song_id,
        status: input.status || 'not_started',
      })
      .select(
        `
        *,
        teacher_profile:profiles!assignments_teacher_id_fkey(id, email, full_name),
        student_profile:profiles!assignments_student_id_fkey(id, email, full_name),
        lesson:lessons(id, lesson_teacher_number, scheduled_at),
        song:songs(id, title, author)
      `
      )
      .single();

    if (error) {
      logger.error('Error creating assignment:', error);
      return { error: 'Failed to create assignment', status: 500 };
    }

    // Queue assignment created notification
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL_REMOTE ||
        'https://example.com';

      await queueNotification({
        type: 'assignment_created',
        recipientUserId: input.student_id,
        templateData: {
          studentName: assignment.student_profile?.full_name || 'Student',
          assignmentTitle: assignment.title,
          dueDate: assignment.due_date
            ? new Date(assignment.due_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'No due date',
          assignmentDescription: assignment.description || '',
          assignmentLink: `${baseUrl}/dashboard/assignments/${assignment.id}`,
        },
        entityType: 'assignment',
        entityId: assignment.id,
        priority: 6,
      });
    } catch (notificationError) {
      logger.error('Failed to queue assignment notification:', notificationError);
      // Don't fail the assignment creation if notification fails
    }

    return { assignment, status: 201 };
  } catch (error) {
    logger.error('Error in createAssignmentHandler:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

type UpdateInput = Partial<AssignmentInput> & { id: string };

/**
 * GET handler - Get single assignment
 */
export async function getAssignmentHandler(
  supabase: SupabaseClient,
  assignmentId: string,
  userId: string,
  profile: Profile
) {
  try {
    const { data: assignment, error } = await supabase
      .from('assignments')
      .select(
        `
        *,
        teacher_profile:profiles!assignments_teacher_id_fkey(id, email, full_name),
        student_profile:profiles!assignments_student_id_fkey(id, email, full_name),
        lesson:lessons(id, lesson_teacher_number, scheduled_at),
        song:songs(id, title, author)
      `
      )
      .eq('id', assignmentId)
      .single();

    if (error || !assignment) {
      return { error: 'Assignment not found', status: 404 };
    }

    // Check access
    if (!profile.isAdmin && assignment.teacher_id !== userId && assignment.student_id !== userId) {
      return { error: 'Unauthorized', status: 403 };
    }

    return { data: assignment, status: 200 };
  } catch (error) {
    logger.error('Error in getAssignmentHandler:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * PUT handler - Update assignment
 */
export async function updateAssignmentHandler(
  supabase: SupabaseClient,
  assignmentId: string,
  userId: string,
  profile: Profile,
  input: UpdateInput,
  _body: unknown // kept for signature compatibility if needed
) {
  try {
    // Get existing assignment
    const { data: existingAssignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id, teacher_id, student_id, lesson_id, status')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !existingAssignment) {
      return { error: 'Assignment not found', status: 404 };
    }

    // Check permissions
    if (!profile.isAdmin) {
      // Teachers can update their own assignments
      if (profile.isTeacher && existingAssignment.teacher_id !== userId) {
        return { error: 'Unauthorized', status: 403 };
      }
      // Students can only update status
      if (profile.isStudent) {
        if (existingAssignment.student_id !== userId) {
          return { error: 'Unauthorized', status: 403 };
        }
        // Check if student is trying to update fields other than status
        const allowedFields = ['status', 'id'];
        const attemptedFields = Object.keys(input);
        const hasUnauthorizedFields = attemptedFields.some(
          (field) => !allowedFields.includes(field)
        );

        if (hasUnauthorizedFields) {
          return { error: 'Students can only update assignment status', status: 403 };
        }
      }
    }

    // Update assignment
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('assignments')
      .update({
        title: input.title,
        description: input.description,
        due_date: input.due_date,
        teacher_id: input.teacher_id,
        student_id: input.student_id,
        lesson_id: input.lesson_id,
        song_id: input.song_id,
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select(
        `
        *,
        teacher_profile:profiles!assignments_teacher_id_fkey(id, email, full_name),
        student_profile:profiles!assignments_student_id_fkey(id, email, full_name),
        lesson:lessons(id, lesson_teacher_number, scheduled_at),
        song:songs(id, title, author)
      `
      )
      .single();

    if (updateError) {
      logger.error('Error updating assignment:', updateError);
      return { error: 'Failed to update assignment', status: 500 };
    }

    return { data: updatedAssignment, status: 200 };
  } catch (error) {
    logger.error('Error in updateAssignmentHandler:', error);
    return { error: 'Internal server error', status: 500 };
  }
}

/**
 * DELETE handler - Delete assignment
 */
export async function deleteAssignmentHandler(
  supabase: SupabaseClient,
  assignmentId: string,
  userId: string,
  profile: Profile
) {
  try {
    // Get existing assignment
    const { data: existingAssignment, error: fetchError } = await supabase
      .from('assignments')
      .select('teacher_id')
      .eq('id', assignmentId)
      .single();

    if (fetchError || !existingAssignment) {
      return { error: 'Assignment not found', status: 404 };
    }

    // Check permissions
    if (!profile.isAdmin) {
      if (existingAssignment.teacher_id !== userId) {
        return { error: 'Unauthorized', status: 403 };
      }
    }

    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (deleteError) {
      logger.error('Error deleting assignment:', deleteError);
      return { error: 'Failed to delete assignment', status: 500 };
    }

    return { status: 200 };
  } catch (error) {
    logger.error('Error in deleteAssignmentHandler:', error);
    return { error: 'Internal server error', status: 500 };
  }
}
