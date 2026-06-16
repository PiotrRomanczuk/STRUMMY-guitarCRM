'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import { AssignmentInputSchema } from '@/schemas/AssignmentSchema';
import { queueNotification } from '@/lib/services/notification-service';
import { createLogger } from '@/lib/logger';

const log = createLogger('assignment-edit-actions');

export type AssignmentFormValues = {
  studentId: string;
  teacherId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  songId?: string | null;
  lessonId?: string | null;
};

type AssignmentActionResult = { assignmentId: string } | { error: string };

const toIso = (value?: string): string | undefined => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

/** Create an assignment (teacher/admin only) and notify the student in-app. */
export async function createAssignmentAction(
  values: AssignmentFormValues
): Promise<AssignmentActionResult> {
  const { user, isAdmin, isTeacher, isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };
  if (!user) return { error: 'Unauthorized' };
  if (!isAdmin && !isTeacher) return { error: 'Only teachers and admins can create assignments' };

  const teacherId = isAdmin && values.teacherId ? values.teacherId : user.id;
  if (!isAdmin && values.teacherId && values.teacherId !== user.id) {
    return { error: 'Teachers can only create assignments for themselves' };
  }

  const parsed = AssignmentInputSchema.safeParse({
    title: values.title,
    description: values.description || undefined,
    due_date: toIso(values.dueDate),
    teacher_id: teacherId,
    student_id: values.studentId,
    song_id: values.songId || null,
    lesson_id: values.lessonId || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assignments')
    .insert(parsed.data)
    .select('id, title, due_date, student_id')
    .single();
  if (error || !data) {
    log.error('Failed to insert assignment', { error });
    return { error: error?.message ?? 'Failed to create assignment' };
  }

  await notifyStudent(data.id as string, data.student_id as string, data.title as string);

  revalidatePath('/dashboard/assignments');
  return { assignmentId: data.id as string };
}

/** Update an assignment's editable fields (teacher/admin only). */
export async function updateAssignmentAction(
  assignmentId: string,
  values: AssignmentFormValues
): Promise<AssignmentActionResult> {
  const { user, isAdmin, isTeacher, isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };
  if (!user) return { error: 'Unauthorized' };
  if (!isAdmin && !isTeacher) return { error: 'Only teachers and admins can update assignments' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assignments')
    .update({
      title: values.title,
      description: values.description || null,
      due_date: toIso(values.dueDate) ?? null,
      song_id: values.songId || null,
      lesson_id: values.lessonId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assignmentId)
    .is('deleted_at', null)
    .select('id')
    .single();
  if (error || !data) {
    if (error?.code === 'PGRST116') return { error: 'Assignment not found' };
    log.error('Failed to update assignment', { error });
    return { error: error?.message ?? 'Failed to update assignment' };
  }

  revalidatePath('/dashboard/assignments');
  revalidatePath(`/dashboard/assignments/${assignmentId}`);
  return { assignmentId };
}

/** Best-effort in-app notification; never blocks assignment creation. */
async function notifyStudent(id: string, studentId: string, title: string): Promise<void> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_API_BASE_URL_REMOTE || '';
    await queueNotification({
      type: 'assignment_created',
      recipientUserId: studentId,
      templateData: {
        assignmentTitle: title,
        assignmentLink: `${baseUrl}/dashboard/assignments/${id}`,
      },
      entityType: 'assignment',
      entityId: id,
      priority: 6,
    });
  } catch (notificationError) {
    log.error('Failed to queue assignment_created notification', { error: notificationError });
  }
}
