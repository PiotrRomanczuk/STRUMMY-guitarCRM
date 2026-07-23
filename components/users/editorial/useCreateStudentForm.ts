'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { AVATAR_COLORS } from '@/schemas/StudentIntakeSchema';
import type {
  SetStudentField,
  StudentFieldErrors,
  StudentFormValues,
} from './StudentFields.shared';
import { studentIntakePayload, trimmedOrUndefined } from './student-fields.helpers';

const DEFAULT_VALUES: StudentFormValues = {
  fullName: '',
  instrument: 'Guitar',
  skillLevel: 'beginner',
  startDate: '',
  avatarColor: AVATAR_COLORS[0],
  studentEmail: '',
  phone: '',
  parentName: '',
  parentEmail: '',
  lessonDay: 'Thu',
  lessonTime: '',
  lessonDuration: 45,
  lessonRate: '',
  billingCycle: 'monthly',
  goals: '',
};

/** Owns the full "Add student" form state, validation, and submit. */
export function useCreateStudentForm() {
  const router = useRouter();
  const [values, setValues] = useState<StudentFormValues>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<StudentFieldErrors>({});
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const setField: SetStudentField = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  }, []);

  const buildPayload = useCallback(
    (v: StudentFormValues) => ({
      email: '',
      full_name: v.fullName.trim(),
      inviteEmail: trimmedOrUndefined(v.studentEmail),
      phone: trimmedOrUndefined(v.phone),
      isStudent: true,
      isShadow: true,
      ...studentIntakePayload(v),
    }),
    []
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const nextErrors: StudentFieldErrors = {};
      if (!values.fullName.trim()) nextErrors.fullName = 'Full name is required.';
      if (!values.skillLevel) nextErrors.skillLevel = 'Level is required.';
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        setError('Please fix the highlighted fields.');
        return;
      }
      setError('');
      startTransition(async () => {
        try {
          const res = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildPayload(values)),
          });
          const body = (await res.json()) as { id?: string; error?: string };
          if (!res.ok) throw new Error(body.error ?? 'Failed to create student');
          router.push(`/dashboard/users/${body.id}`);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to create student');
        }
      });
    },
    [values, buildPayload, router]
  );

  const previewName = useMemo(() => values.fullName.trim(), [values.fullName]);

  return { values, errors, error, isPending, setField, handleSubmit, previewName };
}
