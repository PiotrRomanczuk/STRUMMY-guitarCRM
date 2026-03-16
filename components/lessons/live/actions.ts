'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const updateNotesSchema = z.object({
  lessonId: z.string().uuid(),
  notes: z.string().max(5000, 'Notes cannot exceed 5000 characters'),
});

const lessonStatusSchema = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

const updateStatusSchema = z.object({
  lessonId: z.string().uuid(),
  status: lessonStatusSchema,
});

export async function updateLessonStatus(
  lessonId: string,
  status: z.infer<typeof lessonStatusSchema>
) {
  const parsed = updateStatusSchema.safeParse({ lessonId, status });
  if (!parsed.success) {
    throw new Error('Invalid input for lesson status update');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('lessons')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.lessonId);

  if (error) {
    logger.error('Error updating lesson status:', error);
    throw new Error('Failed to update lesson status');
  }

  revalidatePath(`/dashboard/lessons/${parsed.data.lessonId}`);
}

export async function updateLessonNotes(lessonId: string, notes: string) {
  const parsed = updateNotesSchema.safeParse({ lessonId, notes });
  if (!parsed.success) {
    throw new Error('Invalid input for lesson notes');
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('lessons')
    .update({ notes: parsed.data.notes })
    .eq('id', parsed.data.lessonId);

  if (error) {
    logger.error('Error updating lesson notes:', error);
    throw new Error('Failed to save lesson notes');
  }

  revalidatePath(`/dashboard/lessons/${parsed.data.lessonId}`);
}
