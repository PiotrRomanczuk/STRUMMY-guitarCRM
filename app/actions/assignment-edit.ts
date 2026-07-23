'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import {
  AssignmentInputSchema,
  ChecklistSchema,
  type ChecklistItem,
  type SubmissionType,
} from '@/schemas/AssignmentSchema';
import { getVoicingById } from '@/lib/music-theory/chord-voicings';
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
  checklist?: ChecklistItem[];
  /** Chord IDs to drill. undefined = untouched, [] = clear the drill (ASG-4). */
  chordDrillChordIds?: string[];
  /** Daily practice target in minutes. null = no target; undefined = untouched. */
  dailyTargetMinutes?: number | null;
  /** Expected proof mode; undefined = untouched (defaults to self_report in DB). */
  submissionType?: SubmissionType;
};

type AssignmentActionResult = { assignmentId: string } | { error: string };

const toIso = (value?: string): string | undefined => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

/**
 * Normalize a submitted drill: dedupe, drop unknown chord IDs. Returns the drill
 * config, or null when there's nothing to drill; `undefined` input (field never
 * set) passes through so an update leaves an existing drill untouched.
 */
const toChordDrill = (ids?: string[]): { chord_ids: string[] } | null | undefined => {
  if (ids === undefined) return undefined;
  const valid = Array.from(new Set(ids)).filter((id) => getVoicingById(id));
  return valid.length > 0 ? { chord_ids: valid } : null;
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
    checklist: values.checklist,
    chord_drill: toChordDrill(values.chordDrillChordIds),
    daily_target_minutes: values.dailyTargetMinutes ?? null,
    submission_type: values.submissionType ?? 'self_report',
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

  const updatePayload: Record<string, unknown> = {
    title: values.title,
    description: values.description || null,
    due_date: toIso(values.dueDate) ?? null,
    song_id: values.songId || null,
    lesson_id: values.lessonId || null,
    updated_at: new Date().toISOString(),
  };
  if (values.checklist !== undefined) {
    const checklist = ChecklistSchema.safeParse(values.checklist);
    if (!checklist.success) return { error: 'Invalid checklist' };
    updatePayload.checklist = checklist.data;
  }
  if (values.chordDrillChordIds !== undefined) {
    updatePayload.chord_drill = toChordDrill(values.chordDrillChordIds);
  }
  if (values.dailyTargetMinutes !== undefined) {
    updatePayload.daily_target_minutes = values.dailyTargetMinutes;
  }
  if (values.submissionType !== undefined) {
    updatePayload.submission_type = values.submissionType;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('assignments')
    .update(updatePayload)
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
