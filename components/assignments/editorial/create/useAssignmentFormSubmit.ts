'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createAssignmentAction,
  updateAssignmentAction,
  type AssignmentFormValues,
} from '@/app/actions/assignment-edit';
import { sanitizeChecklist, type ChecklistItem } from '@/schemas/AssignmentSchema';

type SubmitArgs = {
  mode: 'create' | 'edit';
  initialAssignmentId?: string;
  studentId: string;
  title: string;
  description: string;
  dueDate: string;
  songId: string;
  checklist: ChecklistItem[];
  chordIds: string[];
};

export function useAssignmentFormSubmit({
  mode,
  initialAssignmentId,
  studentId,
  title,
  description,
  dueDate,
  songId,
  checklist,
  chordIds,
}: SubmitArgs) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ student?: string; title?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const clearFieldError = useCallback((field: 'student' | 'title') => {
    setFieldErrors((f) => ({ ...f, [field]: undefined }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (isSaving) return;
      setError('');

      // Validate every field at once, attach errors to the fields themselves,
      // and move focus to the first invalid one.
      const errs: { student?: string; title?: string } = {};
      if (mode === 'create' && !studentId) errs.student = 'Choose a student.';
      if (!title.trim()) errs.title = 'Give the assignment a title.';
      setFieldErrors(errs);
      if (errs.student || errs.title) {
        const firstInvalid = errs.student ? 'assignment-student' : 'assignment-title';
        document.getElementById(firstInvalid)?.focus();
        return;
      }

      const values: AssignmentFormValues = {
        studentId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        songId: songId || null,
        checklist: sanitizeChecklist(checklist),
        chordDrillChordIds: chordIds,
      };

      setIsSaving(true);
      const result =
        mode === 'edit' && initialAssignmentId
          ? await updateAssignmentAction(initialAssignmentId, values)
          : await createAssignmentAction(values);
      setIsSaving(false);

      if ('error' in result) {
        setError(result.error);
        return;
      }
      router.push(`/dashboard/assignments/${result.assignmentId}`);
      router.refresh();
    },
    [
      isSaving,
      mode,
      studentId,
      title,
      description,
      dueDate,
      songId,
      checklist,
      chordIds,
      initialAssignmentId,
      router,
    ]
  );

  return { error, fieldErrors, isSaving, handleSubmit, clearFieldError };
}
