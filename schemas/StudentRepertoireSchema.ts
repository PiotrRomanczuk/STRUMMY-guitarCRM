import * as z from 'zod';
import { MusicKeyEnum, UUIDPattern } from './CommonSchema';
import { SongStatusEnum } from './LessonSchema';

export const RepertoirePriorityEnum = z.enum(['high', 'normal', 'low', 'archived']);

export const StudentRepertoireSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  song_id: z.string().uuid(),

  preferred_key: MusicKeyEnum.nullable().optional(),
  capo_fret: z.number().int().min(0).max(20).nullable().optional(),
  custom_strumming: z.string().max(255).nullable().optional(),
  student_notes: z.string().nullable().optional(),
  teacher_notes: z.string().nullable().optional(),

  current_status: SongStatusEnum.default('to_learn'),
  started_at: z.string().nullable().optional(),
  mastered_at: z.string().nullable().optional(),
  difficulty_rating: z.number().int().min(1).max(5).nullable().optional(),

  self_rating: z.number().int().min(1).max(5).nullable().optional(),
  self_rating_updated_at: z.string().nullable().optional(),

  total_practice_minutes: z.number().int().min(0).default(0),
  practice_session_count: z.number().int().min(0).default(0),
  last_practiced_at: z.string().nullable().optional(),

  assigned_by: z.string().uuid().nullable().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  priority: RepertoirePriorityEnum.default('normal'),

  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateRepertoireInputSchema = z.object({
  student_id: UUIDPattern,
  song_id: UUIDPattern,
  preferred_key: MusicKeyEnum.nullable().optional(),
  capo_fret: z.number().int().min(0).max(20).nullable().optional(),
  custom_strumming: z.string().max(255).nullable().optional(),
  teacher_notes: z.string().nullable().optional(),
  priority: RepertoirePriorityEnum.optional(),
  assigned_by: z.string().uuid().optional(),
});

export const UpdateRepertoireInputSchema = z.object({
  preferred_key: MusicKeyEnum.nullable().optional(),
  capo_fret: z.number().int().min(0).max(20).nullable().optional(),
  custom_strumming: z.string().max(255).nullable().optional(),
  student_notes: z.string().nullable().optional(),
  teacher_notes: z.string().nullable().optional(),
  current_status: SongStatusEnum.optional(),
  difficulty_rating: z.number().int().min(1).max(5).nullable().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
  priority: RepertoirePriorityEnum.optional(),
});

/**
 * Bulk reorder input. Each entry pairs an existing repertoire row id with
 * its new sort_order. Validated independently — the action confirms
 * ownership before issuing the updates.
 */
export const ReorderRepertoireInputSchema = z
  .array(
    z.object({
      id: z.string().uuid(),
      sort_order: z.number().int().min(0),
    })
  )
  .min(1, 'At least one item is required')
  .max(500, 'Cannot reorder more than 500 items at once');

export type ReorderRepertoireInput = z.infer<typeof ReorderRepertoireInputSchema>;

export type StudentRepertoireType = z.infer<typeof StudentRepertoireSchema>;
export type CreateRepertoireInput = z.infer<typeof CreateRepertoireInputSchema>;
export type UpdateRepertoireInput = z.infer<typeof UpdateRepertoireInputSchema>;
