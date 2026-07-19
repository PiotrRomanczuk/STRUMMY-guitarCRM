'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLessonAction, updateLessonAction } from '@/app/actions/lesson-edit';
import type { LessonFormValues } from '@/app/actions/lesson-edit';
import { generateRecurringLessons } from '@/app/dashboard/lessons/recurring-actions';

type SubmitArgs = {
  mode: 'create' | 'edit';
  initialLessonId?: string;
  isNewStudent: boolean;
  studentId: string;
  studentEmail: string;
  title: string;
  notes: string;
  scheduledLocal: string;
  status: string;
  songIds: string[];
  repeatWeekly: boolean;
  repeatWeeks: number;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** LES-3: create-mode "repeat weekly" branches into generateRecurringLessons
 * instead of a single createLessonAction call — everything else (edit mode,
 * one-off create) is unchanged from before this option existed. */
export function useLessonFormSubmit({
  mode,
  initialLessonId,
  isNewStudent,
  studentId,
  studentEmail,
  title,
  notes,
  scheduledLocal,
  status,
  songIds,
  repeatWeekly,
  repeatWeeks,
}: SubmitArgs) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (isSaving) return;
      setError('');

      if (!scheduledLocal) {
        setError('Pick a date and time for the lesson.');
        return;
      }
      const values: LessonFormValues = {
        studentId: isNewStudent || !studentId ? undefined : studentId,
        studentEmail: isNewStudent ? studentEmail : undefined,
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
        scheduledAt: new Date(scheduledLocal).toISOString(),
        status: status as LessonFormValues['status'],
        songIds,
      };

      if (mode === 'create' && !values.studentId && !values.studentEmail) {
        setError('Choose a student or add one by email.');
        return;
      }
      if (mode === 'create' && repeatWeekly && !values.studentId) {
        setError('Repeat weekly needs an existing student — add the student first, then repeat.');
        return;
      }

      setIsSaving(true);

      if (mode === 'create' && repeatWeekly && values.studentId) {
        const scheduledDate = new Date(scheduledLocal);
        const recurringResult = await generateRecurringLessons({
          studentId: values.studentId,
          dayOfWeek: scheduledDate.getDay(),
          time: `${pad(scheduledDate.getHours())}:${pad(scheduledDate.getMinutes())}`,
          weeks: repeatWeeks,
          startDate: values.scheduledAt,
          titleTemplate: values.title,
          songIds,
        });
        setIsSaving(false);

        if ('error' in recurringResult) {
          setError(recurringResult.error);
          return;
        }
        router.push('/dashboard/lessons');
        router.refresh();
        return;
      }

      const result =
        mode === 'edit' && initialLessonId
          ? await updateLessonAction(initialLessonId, values)
          : await createLessonAction(values);
      setIsSaving(false);

      if ('error' in result) {
        setError(result.error);
        return;
      }
      router.push(`/dashboard/lessons/${result.lessonId}`);
      router.refresh();
    },
    [
      isSaving,
      scheduledLocal,
      isNewStudent,
      studentId,
      studentEmail,
      title,
      notes,
      status,
      songIds,
      mode,
      initialLessonId,
      router,
      repeatWeekly,
      repeatWeeks,
    ]
  );

  return { error, isSaving, handleSubmit };
}
