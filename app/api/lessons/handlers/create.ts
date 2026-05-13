import { LessonInputSchema } from '@/schemas/LessonSchema';
import { ZodError } from 'zod';
import { addSongsToLesson, insertLessonRecord } from '../utils';
import { syncLessonCreation } from '@/lib/services/calendar-lesson-sync';
import { validateMutationPermission } from '@/lib/auth/permissions';
import { logger } from '@/lib/logger';
import type { UserProfile, SupabaseClient } from './types';

export async function createLessonHandler(
  supabase: SupabaseClient,
  user: { id: string } | null,
  profile: UserProfile | null,
  body: unknown,
): Promise<{ lesson?: unknown; status: number; error?: string }> {
  if (!user) return { error: 'Unauthorized', status: 401 };
  if (!profile) return { error: 'Profile not found', status: 404 };

  if (!validateMutationPermission(profile)) {
    return { error: 'Only admins and teachers can create lessons', status: 403 };
  }

  try {
    const validatedData = LessonInputSchema.parse(body);
    const { song_ids, ...lessonData } = validatedData;

    if (lessonData.teacher_id) {
      const { data: teacher, error: teacherError } = await supabase
        .from('profiles')
        .select('id, is_teacher')
        .eq('id', lessonData.teacher_id)
        .single();

      if (teacherError || !teacher) return { error: 'Teacher not found', status: 400 };
      if (!teacher.is_teacher && !profile.isAdmin)
        return { error: 'Specified user is not a teacher', status: 400 };
      if (!profile.isAdmin && lessonData.teacher_id !== user.id)
        return { error: 'Teachers can only create lessons for themselves', status: 403 };
    }

    if (lessonData.student_id) {
      const { data: student, error: studentError } = await supabase
        .from('profiles')
        .select('id, is_student')
        .eq('id', lessonData.student_id)
        .single();

      if (studentError || !student) return { error: 'Student not found', status: 400 };
      if (!student.is_student) return { error: 'Specified user is not a student', status: 400 };
    }

    const { data, error } = await insertLessonRecord(supabase, lessonData);
    if (error) {
      logger.error('Supabase insert error:', error);
      return { error: error.message, status: 500 };
    }

    if (song_ids && song_ids.length > 0) {
      await addSongsToLesson(supabase, data.id, song_ids);
    }

    await syncLessonCreation(supabase, data);
    return { lesson: data, status: 201 };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        error: `Validation error: ${error.issues.map((e) => e.message).join(', ')}`,
        status: 400,
      };
    }
    return { error: 'Internal server error', status: 500 };
  }
}
