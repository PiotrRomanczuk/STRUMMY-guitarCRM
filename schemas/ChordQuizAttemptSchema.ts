import * as z from 'zod';

/**
 * Input schema for a single chord-quiz attempt.
 * The student_id is derived server-side from the session, never trusted from the client.
 */
export const ChordQuizAttemptInputSchema = z.object({
  chord_id: z.string().min(1, 'chord_id is required').max(64),
  selected_answer: z.string().min(1, 'selected_answer is required').max(64),
  is_correct: z.boolean(),
  response_time_ms: z
    .number()
    .int()
    .min(0)
    .max(10 * 60 * 1000, 'response_time_ms cannot exceed 10 minutes')
    .optional(),
});

export type ChordQuizAttemptInput = z.infer<typeof ChordQuizAttemptInputSchema>;

/** Batched submission — one network round-trip per quiz session. */
export const ChordQuizSessionSchema = z
  .array(ChordQuizAttemptInputSchema)
  .min(1, 'At least one attempt is required')
  .max(50, 'Cannot submit more than 50 attempts in a single session');

export type ChordQuizSession = z.infer<typeof ChordQuizSessionSchema>;

export const QUIZ_SESSION_LENGTH = 10;
