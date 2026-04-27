import * as z from 'zod';
import { HashtagArraySchema } from './HashtagSetSchema';

export const ContentPlatformEnum = z.enum(['tiktok', 'instagram', 'youtube_shorts']);

export const ContentPostStatusEnum = z.enum([
  'planned',
  'scheduled',
  'published',
  'archived',
  'failed',
]);

export const PostStoriesSchema = z.object({
  morning: z.string().max(500).optional(),
  afternoon: z.string().max(500).optional(),
  evening: z.string().max(500).optional(),
});

export const ContentPostSchema = z.object({
  id: z.string().uuid(),
  song_id: z.string().uuid(),
  song_video_id: z.string().uuid().nullable(),
  platform: ContentPlatformEnum,
  status: ContentPostStatusEnum,
  scheduled_at: z.string().datetime().nullable(),
  published_at: z.string().datetime().nullable(),
  hook: z.string().max(280).nullable(),
  caption: z.string().max(2200).nullable(),
  hashtag_set_ids: z.array(z.string().uuid()),
  extra_hashtags: HashtagArraySchema,
  stories: PostStoriesSchema,
  external_url: z.string().url().nullable(),
  external_post_id: z.string().nullable(),
  views_count: z.number().int().nonnegative(),
  likes_count: z.number().int().nonnegative(),
  comments_count: z.number().int().nonnegative(),
  shares_count: z.number().int().nonnegative(),
  saves_count: z.number().int().nonnegative(),
  engagement_rate: z.number().nullable(),
  metrics_updated_at: z.string().datetime().nullable(),
  notes: z.string().max(2000).nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateContentPostInputSchema = z.object({
  song_id: z.string().uuid(),
  song_video_id: z.string().uuid().optional(),
  platform: ContentPlatformEnum,
  status: ContentPostStatusEnum.default('planned'),
  scheduled_at: z.string().datetime().optional(),
  published_at: z.string().datetime().optional(),
  hook: z.string().max(280).optional(),
  caption: z.string().max(2200).optional(),
  hashtag_set_ids: z.array(z.string().uuid()).default([]),
  extra_hashtags: HashtagArraySchema.default([]),
  stories: PostStoriesSchema.default({}),
  external_url: z.string().url().optional(),
  external_post_id: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export const UpdateContentPostInputSchema = z.object({
  song_video_id: z.string().uuid().nullable().optional(),
  platform: ContentPlatformEnum.optional(),
  status: ContentPostStatusEnum.optional(),
  scheduled_at: z.string().datetime().nullable().optional(),
  published_at: z.string().datetime().nullable().optional(),
  hook: z.string().max(280).nullable().optional(),
  caption: z.string().max(2200).nullable().optional(),
  hashtag_set_ids: z.array(z.string().uuid()).optional(),
  extra_hashtags: HashtagArraySchema.optional(),
  stories: PostStoriesSchema.optional(),
  external_url: z.string().url().nullable().optional(),
  external_post_id: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const CreateContentPostMetricInputSchema = z.object({
  views_count: z.number().int().nonnegative(),
  likes_count: z.number().int().nonnegative(),
  comments_count: z.number().int().nonnegative(),
  shares_count: z.number().int().nonnegative(),
  saves_count: z.number().int().nonnegative(),
  captured_at: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export type CreateContentPostInput = z.input<typeof CreateContentPostInputSchema>;
export type UpdateContentPostInput = z.input<typeof UpdateContentPostInputSchema>;
export type CreateContentPostMetricInput = z.input<typeof CreateContentPostMetricInputSchema>;
