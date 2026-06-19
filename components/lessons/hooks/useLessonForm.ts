'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { LessonInputSchema } from '@/schemas/LessonSchema';
import type {
  LessonFormData,
  ValidationErrors,
  Profile,
  UseLessonFormProps,
} from './useLessonForm.types';
import {
  buildInitialFormData,
  clearFieldError,
  checkRequiredFields,
  submitLesson,
  fetchProfiles,
  zodErrorsToMap,
} from './useLessonForm.helpers';

export type { LessonFormData, UseLessonFormProps };

export default function useLessonForm({
  initialData,
  lessonId,
  partial = false,
  fieldsToSubmit,
}: UseLessonFormProps = {}) {
  const [formData, setFormData] = useState<LessonFormData>(() => buildInitialFormData(initialData));
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [students, setStudents] = useState<Profile[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles({ setStudents, setTeachers, setError, setLoading });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) setValidationErrors((prev) => clearFieldError(prev, name));
  };

  const handleBlur = (field: keyof LessonFormData) => {
    try {
      const schema = partial ? LessonInputSchema.partial() : LessonInputSchema;
      const fieldValue = formData[field];
      if (fieldValue || !partial) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        schema.pick({ [field]: true } as any).parse({ [field]: fieldValue });
        if (validationErrors[field])
          setValidationErrors((prev) => clearFieldError(prev, field as string));
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldError = err.issues.find((i) => i.path[0] === field);
        if (fieldError) setValidationErrors((prev) => ({ ...prev, [field]: fieldError.message }));
      }
    }
  };

  const handleSongChange = (songIds: string[]) =>
    setFormData((prev) => ({ ...prev, song_ids: songIds }));

  const handleSubmit = async () => {
    setValidationErrors({});
    setError(null);
    const requiredErrors = checkRequiredFields(formData);
    if (requiredErrors) {
      setValidationErrors(requiredErrors);
      setError('Please fill in all required fields');
      return { success: false, error: 'Please fill in all required fields' };
    }
    try {
      const result = await submitLesson(formData, lessonId, partial, fieldsToSubmit);
      if (!result.success) setError(result.error ?? 'Failed to save lesson');
      return result;
    } catch (err) {
      if (err instanceof z.ZodError) {
        setValidationErrors(zodErrorsToMap(err));
        setError('Please fix the validation errors');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to save lesson');
      }
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  return {
    formData,
    students,
    teachers,
    loading,
    error,
    validationErrors,
    handleChange,
    handleBlur,
    handleSongChange,
    handleSubmit,
  };
}
