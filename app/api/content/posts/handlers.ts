import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CreateContentPostInputSchema,
  UpdateContentPostInputSchema,
  type CreateContentPostInput,
  type UpdateContentPostInput,
} from '@/schemas/ContentPostSchema';
import type { ContentPost, ContentPlatform, ContentPostStatus } from '@/types/ContentPost';
import { canTransitionPostStatus } from '@/lib/content/post-status';

export interface ListPostsFilters {
  songId?: string;
  platform?: ContentPlatform;
  status?: ContentPostStatus;
  from?: string;
  to?: string;
}

export interface PostsListResponse {
  posts: ContentPost[];
}

export interface PostResponse {
  post: ContentPost;
}

export interface ApiError {
  error: string;
  status: number;
}

export type Result<T> = T | ApiError;

const POST_COLUMNS = '*';

export async function listPosts(
  supabase: SupabaseClient,
  filters: ListPostsFilters
): Promise<Result<PostsListResponse>> {
  let query = supabase.from('content_posts').select(POST_COLUMNS);
  if (filters.songId) query = query.eq('song_id', filters.songId);
  if (filters.platform) query = query.eq('platform', filters.platform);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.from) query = query.gte('scheduled_at', filters.from);
  if (filters.to) query = query.lte('scheduled_at', filters.to);
  query = query.order('scheduled_at', { ascending: true, nullsFirst: false });

  const { data, error } = await query;
  if (error) return { error: error.message, status: 500 };
  return { posts: (data ?? []) as ContentPost[] };
}

export async function createPost(
  supabase: SupabaseClient,
  input: unknown
): Promise<Result<PostResponse>> {
  let parsed: CreateContentPostInput;
  try {
    parsed = CreateContentPostInputSchema.parse(input);
  } catch (err) {
    return { error: (err as Error).message, status: 400 };
  }

  const { data, error } = await supabase
    .from('content_posts')
    .insert(parsed)
    .select(POST_COLUMNS)
    .single();
  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return { error: error.message, status };
  }
  return { post: data as ContentPost };
}

export async function getPost(supabase: SupabaseClient, id: string): Promise<Result<PostResponse>> {
  const { data, error } = await supabase
    .from('content_posts')
    .select(POST_COLUMNS)
    .eq('id', id)
    .single();
  if (error) return { error: error.message, status: 404 };
  return { post: data as ContentPost };
}

export async function updatePost(
  supabase: SupabaseClient,
  id: string,
  input: unknown
): Promise<Result<PostResponse>> {
  let parsed: UpdateContentPostInput;
  try {
    parsed = UpdateContentPostInputSchema.parse(input);
  } catch (err) {
    return { error: (err as Error).message, status: 400 };
  }

  if (parsed.status) {
    const { data: current } = await supabase
      .from('content_posts')
      .select('status')
      .eq('id', id)
      .single();
    if (current && !canTransitionPostStatus(current.status as ContentPostStatus, parsed.status)) {
      return {
        error: `Invalid transition: ${current.status} → ${parsed.status}`,
        status: 422,
      };
    }
  }

  const update: Record<string, unknown> = { ...parsed };
  if (parsed.status === 'published' && !parsed.published_at) {
    update.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('content_posts')
    .update(update)
    .eq('id', id)
    .select(POST_COLUMNS)
    .single();
  if (error) return { error: error.message, status: 500 };
  if (!data) return { error: 'Post not found', status: 404 };
  return { post: data as ContentPost };
}

export async function deletePost(
  supabase: SupabaseClient,
  id: string
): Promise<Result<{ success: true }>> {
  const { error } = await supabase.from('content_posts').delete().eq('id', id);
  if (error) return { error: error.message, status: 500 };
  return { success: true };
}
