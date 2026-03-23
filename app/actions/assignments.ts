'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import {
  validateStatusTransition,
  type AssignmentStatus,
} from '@/schemas/AssignmentSchema';
import { createLogger } from '@/lib/logger';

const log = createLogger('assignment-actions');

interface UpdateStatusResult {
  success: true;
  assignmentId: string;
  newStatus: AssignmentStatus;
}

interface UpdateStatusError {
  error: string;
}

/**
 * Server action for students to update their assignment status.
 * Validates ownership, status transitions, and test account guard.
 */
export async function updateAssignmentStatus(
  assignmentId: string,
  newStatus: AssignmentStatus
): Promise<UpdateStatusResult | UpdateStatusError> {
  const { user, isStudent, isDevelopment } = await getUserWithRolesSSR();

  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };

  if (!user) {
    return { error: 'Unauthorized' };
  }

  if (!isStudent) {
    return { error: 'Only students can use this action' };
  }

  const supabase = await createClient();

  // Fetch assignment and verify ownership
  const { data: assignment, error: fetchError } = await supabase
    .from('assignments')
    .select('id, student_id, status')
    .eq('id', assignmentId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !assignment) {
    return { error: 'Assignment not found' };
  }

  if (assignment.student_id !== user.id) {
    return { error: 'You can only update your own assignments' };
  }

  // Validate transition
  const transition = validateStatusTransition(assignment.status, newStatus);
  if (!transition.valid) {
    return { error: transition.error ?? 'Invalid status transition' };
  }

  // Perform the update
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

  return { success: true, assignmentId, newStatus };
}
