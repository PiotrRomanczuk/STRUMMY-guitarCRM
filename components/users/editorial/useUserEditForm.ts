'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  AVATAR_COLORS,
  type BillingCycle,
  type LessonDay,
  type SkillLevel,
} from '@/schemas/StudentIntakeSchema';
import type { EditableUser, StudentStatus } from './UserEditFormEditorial.types';
import type { StudentFormValues } from './StudentFields.shared';
import { studentIntakePayload } from './student-fields.helpers';

const toValues = (user: EditableUser): StudentFormValues => ({
  fullName: user.fullName ?? '',
  instrument: user.instrument ?? 'Guitar',
  skillLevel: (user.skillLevel as SkillLevel) ?? 'beginner',
  startDate: user.startDate ?? '',
  avatarColor: user.avatarColor ?? AVATAR_COLORS[0],
  studentEmail: user.studentEmail ?? '',
  phone: user.phone ?? '',
  parentName: user.parentName ?? '',
  parentEmail: user.parentEmail ?? '',
  lessonDay: (user.lessonDay as LessonDay) ?? 'Thu',
  lessonTime: user.lessonTime ?? '',
  lessonDuration: user.lessonDurationMinutes ?? 45,
  lessonRate: user.lessonRate != null ? String(user.lessonRate) : '',
  billingCycle: (user.billingCycle as BillingCycle) ?? 'monthly',
  goals: user.goals ?? '',
});

/** State + save logic for the editorial user/student edit form. */
export function useUserEditForm(user: EditableUser) {
  const router = useRouter();
  const [values, setValues] = useState<StudentFormValues>(() => toValues(user));
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  const [isTeacher, setIsTeacher] = useState(user.isTeacher);
  const [isStudent, setIsStudent] = useState(user.isStudent);
  const [isActive, setIsActive] = useState(user.isActive);
  const [studentStatus, setStudentStatus] = useState<StudentStatus>(user.studentStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const setField = useCallback(
    <K extends keyof StudentFormValues>(key: K, value: StudentFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const save = useCallback(async () => {
    setIsSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: values.fullName,
          phone: values.phone,
          isAdmin,
          isTeacher,
          isStudent,
          isActive,
          studentStatus,
          ...(isStudent ? studentIntakePayload(values) : {}),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to save');
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [user.id, values, isAdmin, isTeacher, isStudent, isActive, studentStatus, router]);

  return {
    values,
    setField,
    isAdmin,
    setIsAdmin,
    isTeacher,
    setIsTeacher,
    isStudent,
    setIsStudent,
    isActive,
    setIsActive,
    studentStatus,
    setStudentStatus,
    isSaving,
    error,
    saved,
    save,
  };
}
