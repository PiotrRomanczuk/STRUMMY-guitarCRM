'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import { LessonInputSchema, type LessonInput, type LessonFormat } from '@/schemas/LessonSchema';
import {
  insertLessonRecord,
  addSongsToLesson,
  handleLessonSongsUpdate,
  prepareLessonForDb,
} from '@/app/api/lessons/utils';
import { syncLessonCreation, syncLessonUpdate } from '@/lib/services/calendar-lesson-sync';
import { createLogger } from '@/lib/logger';
import { resolveStudent } from './lesson-edit.helpers';

const log = createLogger('lesson-edit-actions');

export type LessonFormValues = {
  studentId?: string;
  studentEmail?: string;
  teacherId?: string;
  title?: string;
  notes?: string;
  scheduledAt: string;
  status?: LessonInput['status'];
  durationMinutes?: number;
  format?: LessonFormat;
  songIds?: string[];
};

type LessonActionResult = { lessonId: string } | { error: string; ambiguous?: boolean };

const ALLOWED_UPDATE_FIELDS = [
  'title',
  'notes',
  'scheduled_at',
  'status',
  'duration_minutes',
  'format',
];

/** Create a lesson from the editorial form (teacher/admin only; inline shadow create). */
export async function createLessonAction(values: LessonFormValues): Promise<LessonActionResult> {
  const { user, isAdmin, isTeacher, isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };
  if (!user) return { error: 'Unauthorized' };
  if (!isAdmin && !isTeacher) return { error: 'Only teachers and admins can create lessons' };

  const teacherId = isAdmin && values.teacherId ? values.teacherId : user.id;
  if (!isAdmin && values.teacherId && values.teacherId !== user.id) {
    return { error: 'Teachers can only create lessons for themselves' };
  }

  const resolved = await resolveStudent(values.studentId, values.studentEmail);
  if (!resolved.ok) return { error: resolved.error, ambiguous: resolved.ambiguous };

  const parsed = LessonInputSchema.safeParse({
    student_id: resolved.studentId,
    teacher_id: teacherId,
    title: values.title || undefined,
    notes: values.notes || undefined,
    scheduled_at: values.scheduledAt,
    status: values.status,
    duration_minutes: values.durationMinutes,
    format: values.format,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') };
  }

  const supabase = await createClient();
  // `insertLessonRecord` → `prepareLessonForDb` strips song_ids; songs are linked separately below.
  const { data, error } = await insertLessonRecord(supabase, parsed.data);
  if (error || !data) {
    log.error('Failed to insert lesson', { error });
    return { error: error?.message ?? 'Failed to create lesson' };
  }

  if (values.songIds && values.songIds.length > 0) {
    await addSongsToLesson(supabase, data.id, values.songIds);
  }
  await syncLessonCreation(supabase, data);

  revalidatePath('/dashboard/lessons');
  return { lessonId: data.id as string };
}

/** Update an existing lesson from the editorial form (teacher/admin only). */
export async function updateLessonAction(
  lessonId: string,
  values: LessonFormValues
): Promise<LessonActionResult> {
  const { user, isAdmin, isTeacher, isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error };
  if (!user) return { error: 'Unauthorized' };
  if (!isAdmin && !isTeacher) return { error: 'Only teachers and admins can update lessons' };

  const parsed = LessonInputSchema.partial().safeParse({
    title: values.title,
    notes: values.notes,
    scheduled_at: values.scheduledAt,
    status: values.status,
    duration_minutes: values.durationMinutes,
    format: values.format,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(', ') };
  }

  const supabase = await createClient();
  const dbData = prepareLessonForDb(parsed.data);
  const updateData = Object.fromEntries(
    Object.entries(dbData).filter(
      ([key, val]) => ALLOWED_UPDATE_FIELDS.includes(key) && val !== undefined
    )
  );

  const { data, error } = await supabase
    .from('lessons')
    .update(updateData)
    .eq('id', lessonId)
    .select()
    .single();
  if (error || !data) {
    if (error?.code === 'PGRST116') return { error: 'Lesson not found' };
    log.error('Failed to update lesson', { error });
    return { error: error?.message ?? 'Failed to update lesson' };
  }

  if (values.songIds) await handleLessonSongsUpdate(supabase, lessonId, values.songIds);
  if (updateData.title || updateData.scheduled_at || updateData.notes !== undefined) {
    await syncLessonUpdate(supabase, data, {
      title: updateData.title as string | undefined,
      scheduled_at: updateData.scheduled_at as string | undefined,
      notes: updateData.notes as string | null | undefined,
    });
  }

  revalidatePath('/dashboard/lessons');
  revalidatePath(`/dashboard/lessons/${lessonId}`);
  return { lessonId };
}
