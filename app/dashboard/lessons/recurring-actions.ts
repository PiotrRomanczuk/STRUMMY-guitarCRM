'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import { logger } from '@/lib/logger';
import { RecurringLessonInputSchema } from '@/schemas/RecurringLessonSchema';
import { generateRecurringDates } from '@/lib/lessons/recurring-dates';

interface RecurringLessonResult {
  created: number;
  lessons: { id: string; scheduled_at: string }[];
}

interface RecurringLessonError {
  error: string;
}

export async function generateRecurringLessons(input: {
  studentId: string;
  dayOfWeek: number;
  time: string;
  weeks: number;
  startDate?: string;
  titleTemplate?: string;
  songIds?: string[];
}): Promise<RecurringLessonResult | RecurringLessonError> {
  const { user, isAdmin, isTeacher, isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return { error: guard.error ?? 'Test accounts cannot create lessons' };

  if (!user) return { error: 'Unauthorized' };
  if (!isAdmin && !isTeacher) return { error: 'Only admins and teachers can create lessons' };

  const parsed = RecurringLessonInputSchema.safeParse(input);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join(', ');
    return { error: `Validation error: ${messages}` };
  }

  const { studentId, dayOfWeek, time, weeks, startDate, titleTemplate, songIds } = parsed.data;
  const dates = generateRecurringDates({ dayOfWeek, time, weeks, startDate });

  const supabase = await createClient();

  // Fetch next lesson_teacher_number for this teacher-student pair
  const { data: existingLessons } = await supabase
    .from('lessons')
    .select('lesson_teacher_number')
    .eq('teacher_id', user.id)
    .eq('student_id', studentId)
    .order('lesson_teacher_number', { ascending: false })
    .limit(1);

  const baseNumber =
    (existingLessons && existingLessons.length > 0
      ? existingLessons[0].lesson_teacher_number
      : 0) ?? 0;

  const lessonRows = dates.map((scheduledAt, i) => ({
    teacher_id: user.id,
    student_id: studentId,
    lesson_teacher_number: baseNumber + i + 1,
    scheduled_at: scheduledAt,
    title: titleTemplate
      ? titleTemplate.replace('#{n}', String(baseNumber + i + 1))
      : null,
    status: 'SCHEDULED' as const,
    creator_user_id: user.id,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('lessons')
    .insert(lessonRows)
    .select('id, scheduled_at');

  if (insertError) {
    logger.error('[generateRecurringLessons] Insert error:', insertError);
    return { error: insertError.message };
  }

  // Link songs if provided
  if (songIds && songIds.length > 0 && inserted) {
    const songRows = inserted.flatMap((lesson) =>
      songIds.map((songId) => ({
        lesson_id: lesson.id,
        song_id: songId,
        status: 'to_learn' as const,
      }))
    );

    const { error: songError } = await supabase
      .from('lesson_songs')
      .insert(songRows);

    if (songError) {
      logger.error('[generateRecurringLessons] Song link error:', songError);
    }
  }

  revalidatePath('/dashboard/lessons');

  return {
    created: inserted?.length ?? 0,
    lessons: (inserted ?? []).map((l) => ({ id: l.id, scheduled_at: l.scheduled_at })),
  };
}
