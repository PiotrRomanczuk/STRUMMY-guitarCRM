'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import { ChecklistSchema, applyChecklistToggle } from '@/schemas/AssignmentSchema';
import { createLogger } from '@/lib/logger';

const log = createLogger('assignment-checklist-action');

type ChecklistResult = { success: true } | { error: string };

/**
 * Tick/untick a single checklist item.
 *
 * A student's write goes through the SECURITY DEFINER RPC
 * `student_toggle_checklist_item`, which re-validates ownership and flips only
 * the one item's `done` flag in SQL — the DB is the boundary (ADR-0001), not
 * this code. Teachers/admins own the row and go through a plain update. Either
 * way only `done` changes; text/order/membership are never mutated here.
 */
export async function toggleChecklistItemAction(
  assignmentId: string,
  itemId: string,
  done: boolean
): Promise<ChecklistResult> {
  const { user, isAdmin, isTeacher, isStudent, isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };
  if (!user) return { error: 'Unauthorized' };

  const supabase = await createClient();
  const { data: assignment, error: fetchError } = await supabase
    .from('assignments')
    .select('id, teacher_id, student_id, checklist')
    .eq('id', assignmentId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !assignment) return { error: 'Assignment not found' };

  const isOwningStudent = isStudent && assignment.student_id === user.id;
  const isOwningTeacher = isTeacher && assignment.teacher_id === user.id;
  if (!isAdmin && !isOwningTeacher && !isOwningStudent) {
    return { error: 'You cannot change this assignment' };
  }

  const parsed = ChecklistSchema.safeParse(assignment.checklist);
  const items = parsed.success ? parsed.data : [];
  if (!items.some((i) => i.id === itemId)) return { error: 'Checklist item not found' };

  const useStudentRpc = isOwningStudent && !isAdmin && !isOwningTeacher;
  const { error: updateError } = useStudentRpc
    ? await supabase.rpc('student_toggle_checklist_item', {
        p_assignment_id: assignmentId,
        p_item_id: itemId,
        p_done: done,
      })
    : await supabase
        .from('assignments')
        .update({ checklist: applyChecklistToggle(items, itemId, done) })
        .eq('id', assignmentId);

  if (updateError) {
    log.error('Failed to toggle checklist item', { assignmentId, itemId, error: updateError });
    return { error: 'Failed to update checklist' };
  }

  revalidatePath('/dashboard/assignments');
  revalidatePath(`/dashboard/assignments/${assignmentId}`);
  return { success: true };
}
