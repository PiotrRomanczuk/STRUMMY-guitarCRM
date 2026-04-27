import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CreateContentPostMetricInputSchema,
  type CreateContentPostMetricInput,
} from '@/schemas/ContentPostSchema';
import type { ContentPost } from '@/types/ContentPost';
import type { ContentPostMetric } from '@/types/ContentPostMetric';
import { computeEngagementRate } from '@/lib/content/engagement';

export interface MetricsResponse {
  metric: ContentPostMetric;
  post: ContentPost;
}

export interface ApiError {
  error: string;
  status: number;
}

export type Result<T> = T | ApiError;

export async function appendMetric(
  supabase: SupabaseClient,
  postId: string,
  input: unknown
): Promise<Result<MetricsResponse>> {
  let parsed: CreateContentPostMetricInput;
  try {
    parsed = CreateContentPostMetricInputSchema.parse(input);
  } catch (err) {
    return { error: (err as Error).message, status: 400 };
  }

  const captured = parsed.captured_at ?? new Date().toISOString();
  const engagement = computeEngagementRate({
    views: parsed.views_count,
    likes: parsed.likes_count,
    comments: parsed.comments_count,
    shares: parsed.shares_count,
    saves: parsed.saves_count,
  });

  const { data: metric, error: insertErr } = await supabase
    .from('content_post_metrics')
    .insert({
      post_id: postId,
      captured_at: captured,
      views_count: parsed.views_count,
      likes_count: parsed.likes_count,
      comments_count: parsed.comments_count,
      shares_count: parsed.shares_count,
      saves_count: parsed.saves_count,
      notes: parsed.notes ?? null,
    })
    .select('*')
    .single();
  if (insertErr) return { error: insertErr.message, status: 500 };

  const { data: post, error: updateErr } = await supabase
    .from('content_posts')
    .update({
      views_count: parsed.views_count,
      likes_count: parsed.likes_count,
      comments_count: parsed.comments_count,
      shares_count: parsed.shares_count,
      saves_count: parsed.saves_count,
      engagement_rate: engagement,
      metrics_updated_at: captured,
    })
    .eq('id', postId)
    .select('*')
    .single();
  if (updateErr) return { error: updateErr.message, status: 500 };

  return { metric: metric as ContentPostMetric, post: post as ContentPost };
}
