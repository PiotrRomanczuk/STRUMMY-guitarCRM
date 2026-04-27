import * as z from 'zod';

const HASHTAG_RE = /^#?[A-Za-z0-9_]{1,80}$/;

export const HashtagArraySchema = z.array(z.string().regex(HASHTAG_RE, 'Invalid hashtag')).max(40);

export const HashtagSetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(80),
  description: z.string().max(500).nullable(),
  hashtags: HashtagArraySchema,
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateHashtagSetInputSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
  hashtags: HashtagArraySchema.default([]),
  is_active: z.boolean().default(true),
});

export const UpdateHashtagSetInputSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  description: z.string().max(500).nullable().optional(),
  hashtags: HashtagArraySchema.optional(),
  is_active: z.boolean().optional(),
});

export type CreateHashtagSetInput = z.input<typeof CreateHashtagSetInputSchema>;
export type UpdateHashtagSetInput = z.input<typeof UpdateHashtagSetInputSchema>;
