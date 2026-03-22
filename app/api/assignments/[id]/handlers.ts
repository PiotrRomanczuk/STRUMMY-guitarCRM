import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

interface Profile {
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

interface Assignment {
  id: string;
  teacher_id: string;
  student_id: string;
  [key: string]: string | boolean | number | null | undefined;
}

interface UpdateInput {
  id: string;
  title?: string;
  description?: string;
  due_date?: string;
  status?: string;
  lesson_id?: string | null;
  song_id?: string | null;
}

/**
 * Check if user has access to view an assignment
 */
function checkViewAccess(profile: Profile, assignment: Assignment, userId: string): boolean {
  return (
    profile.isAdmin ||
    (profile.isTeacher && assignment.teacher_id === userId) ||
    (profile.isStudent && assignment.student_id === userId)
  );
}

/**
 * Check if user has access to update an assignment
 */
function checkUpdateAccess(profile: Profile, assignment: Assignment, userId: string) {
  const isTeacherOwner = profile.isTeacher && assignment.teacher_id === userId;
  const isStudentOwner = profile.isStudent && assignment.student_id === userId;

  return {
    canUpdate: profile.isAdmin || isTeacherOwner || isStudentOwner,
    isTeacherOwner,
    isStudentOwner,
  };
}

/**
 * Validate student can only update allowed fields
 */
function validateStudentUpdate(
  isStudentOwner: boolean,
  profile: Profile,
  isTeacherOwner: boolean,
  body: Record<string, unknown>
): { valid: boolean; error?: string } {
  if (isStudentOwner && !profile.isAdmin && !isTeacherOwner) {
    const allowedFields = ['status'];
    const providedFields = Object.keys(body);
    const hasDisallowedFields = providedFields.some((field) => !allowedFields.includes(field));

    if (hasDisallowedFields) {
      return { valid: false, error: 'Students can only update assignment status' };
    }
  }

  return { valid: true };
}

/**
 * Build update data object from input
 */
function buildUpdateData(input: UpdateInput) {
  const updateData: Record<string, string | null> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.due_date !== undefined) updateData.due_date = input.due_date;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.lesson_id !== undefined) updateData.lesson_id = input.lesson_id;
  if (input.song_id !== undefined) updateData.song_id = input.song_id;
  return updateData;
}

/**
 * Check if user has permission to delete an assignment
 */
function checkDeletePermission(
  profile: Profile,
  assignment: { teacher_id: string },
  userId: string
): boolean {
  return profile.isAdmin || assignment.teacher_id === userId;
}

/**
 * GET handler - Fetch single assignment
 */
export async function getAssignmentHandler(
  supabase: SupabaseClient,
  assignmentId: string,
  userId: string,
  profile: Profile
) {
  // Fetch assignment with related data (exclude soft-deleted)
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select(
      `
      *,
      teacher_profile:profiles!assignments_teacher_id_fkey(id, email, full_name),
      student_profile:profiles!assignments_student_id_fkey(id, email, full_name),
      lesson:lessons(id, lesson_teacher_number, scheduled_at, status),
      song:songs(id, title, author)
    `
    )
    .eq('id', assignmentId)
    .is('deleted_at', null)
    .single();

  if (error || !assignment) {
    return { data: null, error: 'Assignment not found', status: 404 };
  }

  // Check access permissions
  if (!checkViewAccess(profile, assignment, userId)) {
    return { data: null, error: 'Access denied', status: 403 };
  }

  return { data: assignment, error: null, status: 200 };
}

/**
 * PATCH handler - Update assignment
 */
export async function updateAssignmentHandler(
  supabase: SupabaseClient,
  assignmentId: string,
  userId: string,
  profile: Profile,
  input: UpdateInput,
  body: Record<string, unknown>
) {
  // Fetch existing assignment (exclude soft-deleted)
  const { data: existingAssignment, error: fetchError } = await supabase
    .from('assignments')
    .select('id, teacher_id, student_id, lesson_id, status')
    .eq('id', assignmentId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !existingAssignment) {
    return { data: null, error: 'Assignment not found', status: 404 };
  }

  // Check update permissions
  const { canUpdate, isTeacherOwner, isStudentOwner } = checkUpdateAccess(
    profile,
    existingAssignment,
    userId
  );

  if (!canUpdate) {
    return { data: null, error: 'Access denied', status: 403 };
  }

  // Validate student can only update allowed fields
  const studentValidation = validateStudentUpdate(isStudentOwner, profile, isTeacherOwner, body);
  if (!studentValidation.valid) {
    return { data: null, error: studentValidation.error!, status: 403 };
  }

  // Build update data
  const updateData = buildUpdateData(input);

  // Update assignment
  const { data: assignment, error } = await supabase
    .from('assignments')
    .update(updateData)
    .eq('id', assignmentId)
    .select(
      `
      *,
      teacher_profile:profiles!assignments_teacher_id_fkey(id, email, full_name),
      student_profile:profiles!assignments_student_id_fkey(id, email, full_name),
      lesson:lessons(id, lesson_teacher_number, scheduled_at, status),
      song:songs(id, title, author)
    `
    )
    .single();

  if (error) {
    logger.error('Error updating assignment:', error);
    return { data: null, error: 'Failed to update assignment', status: 500 };
  }

  return { data: assignment, error: null, status: 200 };
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
  // Fetch existing assignment to check ownership (exclude soft-deleted)
  const { data: existingAssignment, error: fetchError } = await supabase
    .from('assignments')
    .select('teacher_id')
    .eq('id', assignmentId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !existingAssignment) {
    return { data: null, error: 'Assignment not found', status: 404 };
  }

  // Check delete permissions
  if (!checkDeletePermission(profile, existingAssignment, userId)) {
    return {
      data: null,
      error: 'Only admins and the assignment creator can delete assignments',
      status: 403,
    };
  }

  // Soft delete assignment
  const { error } = await supabase
    .from('assignments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', assignmentId);

  if (error) {
    logger.error('Error deleting assignment:', error);
    return { data: null, error: 'Failed to delete assignment', status: 500 };
  }

  return { data: { message: 'Assignment deleted successfully' }, error: null, status: 200 };
}
