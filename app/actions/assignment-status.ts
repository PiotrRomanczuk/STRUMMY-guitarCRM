'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import { validateStatusTransition, type AssignmentStatus } from '@/schemas/AssignmentSchema';
import { createLogger } from '@/lib/logger';

const log = createLogger('assignment-status-action');

type StatusResult = { success: true; newStatus: AssignmentStatus } | { error: string };

// Students may only advance their own work; teachers/admin own the full machine.
const STUDENT_TARGETS: AssignmentStatus[] = ['in_progress', 'completed'];

/**
 * Status-only transition shared by students and teachers/admins.
 * Writes nothing but `status`; RLS enforces row ownership (student-status policy
 * for students, teacher/admin policy otherwise). Column-scope is enforced here.
 */
export async function updateAssignmentStatusAction(
  assignmentId: string,
  newStatus: AssignmentStatus
): Promise<StatusResult> {
  const { user, isAdmin, isTeacher, isStudent, isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };
  if (!user) return { error: 'Unauthorized' };

  const supabase = await createClient();
  const { data: assignment, error: fetchError } = await supabase
    .from('assignments')
    .select('id, teacher_id, student_id, status')
    .eq('id', assignmentId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !assignment) return { error: 'Assignment not found' };

  const isOwningStudent = isStudent && assignment.student_id === user.id;
  const isOwningTeacher = isTeacher && assignment.teacher_id === user.id;
  if (!isAdmin && !isOwningTeacher && !isOwningStudent) {
    return { error: 'You cannot change this assignment' };
  }
  if (isOwningStudent && !isAdmin && !isOwningTeacher && !STUDENT_TARGETS.includes(newStatus)) {
    return { error: 'Students can only start or complete an assignment' };
  }

  const transition = validateStatusTransition(assignment.status, newStatus);
  if (!transition.valid) return { error: transition.error ?? 'Invalid status transition' };

  const { error: updateError } = await supabase
    .from('assignments')
    .update({ status: newStatus })
    .eq('id', assignmentId);
  if (updateError) {
    log.error('Failed to update assignment status', {
      assignmentId,
      newStatus,
      error: updateError,
    });
    return { error: 'Failed to update assignment status' };
  }

  revalidatePath('/dashboard/assignments');
  revalidatePath(`/dashboard/assignments/${assignmentId}`);
  return { success: true, newStatus };
}
