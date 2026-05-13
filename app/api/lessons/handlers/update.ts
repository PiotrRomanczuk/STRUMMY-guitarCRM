import { LessonInputSchema } from '@/schemas/LessonSchema';
import { ZodError } from 'zod';
import { prepareLessonForDb, handleLessonSongsUpdate } from '../utils';
import { syncLessonUpdate } from '@/lib/services/calendar-lesson-sync';
import { validateMutationPermission } from '@/lib/auth/permissions';
import type { UserProfile, SupabaseClient } from './types';

const ALLOWED_UPDATE_FIELDS = ['student_id', 'teacher_id', 'title', 'notes', 'scheduled_at', 'status'];

export async function updateLessonHandler(
  supabase: SupabaseClient,
  user: { id: string } | null,
  profile: UserProfile | null,
  id: string,
  body: unknown,
): Promise<{ lesson?: unknown; status: number; error?: string }> {
  if (!user) return { error: 'Unauthorized', status: 401 };
  if (!profile) return { error: 'Profile not found', status: 404 };

  if (!validateMutationPermission(profile)) {
    return { error: 'Only admins and teachers can update lessons', status: 403 };
  }

  try {
    const validatedData = LessonInputSchema.partial().parse(body);
    const { song_ids, ...lessonData } = validatedData;

    const dbData = prepareLessonForDb(lessonData);
    const updateData = Object.keys(dbData)
      .filter((key) => ALLOWED_UPDATE_FIELDS.includes(key) && dbData[key] !== undefined)
      .reduce(
        (obj, key) => { obj[key] = dbData[key]; return obj; },
        {} as Record<string, unknown>,
      );

    let data;
    if (Object.keys(updateData).length > 0) {
      const result = await supabase.from('lessons').update(updateData).eq('id', id).select().single();
      if (result.error) {
        return result.error.code === 'PGRST116'
          ? { error: 'Lesson not found', status: 404 }
          : { error: result.error.message, status: 500 };
      }
      data = result.data;
    } else {
      const result = await supabase.from('lessons').select().eq('id', id).single();
      if (result.error) {
        return result.error.code === 'PGRST116'
          ? { error: 'Lesson not found', status: 404 }
          : { error: result.error.message, status: 500 };
      }
      data = result.data;
    }

    if (song_ids) await handleLessonSongsUpdate(supabase, id, song_ids);

    if (updateData.title || updateData.scheduled_at || updateData.notes !== undefined) {
      await syncLessonUpdate(supabase, data, {
        title: updateData.title as string | undefined,
        scheduled_at: updateData.scheduled_at as string | undefined,
        notes: updateData.notes as string | null | undefined,
      });
    }

    // Lesson recap email handled by DB trigger tr_notify_lesson_completed
    return { lesson: data, status: 200 };
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
