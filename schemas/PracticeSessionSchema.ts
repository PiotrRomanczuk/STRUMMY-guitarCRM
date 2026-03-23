import * as z from 'zod';

/**
 * Input schema for logging a practice session.
 * song_id is optional (student might practice general technique).
 */
export const PracticeSessionInputSchema = z.object({
  song_id: z.string().uuid('Invalid song ID').optional(),
  duration_minutes: z
    .number()
    .int('Duration must be a whole number')
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Duration cannot exceed 8 hours'),
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
});

export type PracticeSessionInput = z.infer<typeof PracticeSessionInputSchema>;

/** Quick-pick duration presets in minutes */
export const DURATION_PRESETS = [10, 15, 20, 30, 45, 60] as const;
