import { z } from 'zod';
import { LessonInputSchema } from '@/schemas/LessonSchema';
import { createClient } from '@/lib/supabase/client';
import type { LessonFormData, ValidationErrors, Profile } from './useLessonForm.types';

/** Convert ISO datetime string to datetime-local format (YYYY-MM-DDTHH:mm). */
export function formatScheduledAtForInput(iso?: string): string {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch {
    return '';
  }
}

/** Build initial LessonFormData from optional partial initialData. */
export function buildInitialFormData(initialData?: Partial<LessonFormData>): LessonFormData {
  return {
    student_id: initialData?.student_id ?? '',
    teacher_id: initialData?.teacher_id ?? '',
    scheduled_at: formatScheduledAtForInput(initialData?.scheduled_at),
    title: initialData?.title ?? '',
    notes: initialData?.notes ?? '',
    status: initialData?.status ?? 'SCHEDULED',
    song_ids: initialData?.song_ids ?? [],
  };
}

/** Remove a single key from a ValidationErrors map (immutably). */
export function clearFieldError(errors: ValidationErrors, field: string): ValidationErrors {
  const next = { ...errors };
  delete next[field];
  return next;
}

/** Return frontend-required-field errors, or null if clean. */
export function checkRequiredFields(formData: LessonFormData): ValidationErrors | null {
  const errors: ValidationErrors = {};
  if (!formData.student_id) errors.student_id = 'Please select a student';
  if (!formData.teacher_id) errors.teacher_id = 'Please select a teacher';
  if (!formData.scheduled_at) errors.scheduled_at = 'Scheduled date & time is required';
  return Object.keys(errors).length > 0 ? errors : null;
}

/** Convert ZodError issues into a flat ValidationErrors map. */
export function zodErrorsToMap(err: z.ZodError): ValidationErrors {
  const errors: ValidationErrors = {};
  err.issues.forEach((e) => {
    errors[e.path[0] as string] = e.message;
  });
  return errors;
}

/** Validate then POST/PUT the lesson to the API. */
export async function submitLesson(
  formData: LessonFormData,
  lessonId: string | undefined,
  partial: boolean,
  fieldsToSubmit: (keyof LessonFormData)[] | undefined
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  let dataToValidate: Partial<LessonFormData> = formData;
  if (fieldsToSubmit) {
    dataToValidate = fieldsToSubmit.reduce((acc, key) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (acc as any)[key] = formData[key];
      return acc;
    }, {} as Partial<LessonFormData>);
  }
  const schema = partial ? LessonInputSchema.partial() : LessonInputSchema;
  const validatedData = schema.parse(dataToValidate);
  const url = lessonId ? `/api/lessons/${lessonId}` : '/api/lessons';
  const method = lessonId ? 'PUT' : 'POST';
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validatedData),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to save lesson' }));
    return { success: false, error: errorData.error ?? 'Failed to save lesson' };
  }
  return { success: true, data: await response.json() };
}

export interface FetchProfilesCallbacks {
  setStudents: (s: Profile[]) => void;
  setTeachers: (t: Profile[]) => void;
  setError: (e: string | null) => void;
  setLoading: (l: boolean) => void;
}

/** Fetch students and teachers from Supabase and update state via callbacks. */
export async function fetchProfiles(callbacks: FetchProfilesCallbacks): Promise<void> {
  try {
    const supabase = createClient();
    const [studentsRes, teachersRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_student', true)
        .order('full_name'),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_teacher', true)
        .order('full_name'),
    ]);
    if (studentsRes.error) throw studentsRes.error;
    if (teachersRes.error) throw teachersRes.error;
    callbacks.setStudents(studentsRes.data || []);
    callbacks.setTeachers(teachersRes.data || []);
  } catch (err) {
    callbacks.setError(err instanceof Error ? err.message : 'Failed to load profiles');
  } finally {
    callbacks.setLoading(false);
  }
}
