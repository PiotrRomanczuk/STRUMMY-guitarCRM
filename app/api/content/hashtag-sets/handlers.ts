import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CreateHashtagSetInputSchema,
  UpdateHashtagSetInputSchema,
} from '@/schemas/HashtagSetSchema';
import type { HashtagSet } from '@/types/HashtagSet';

export interface ApiError {
  error: string;
  status: number;
}
export type Result<T> = T | ApiError;

export interface HashtagSetsResponse {
  hashtagSets: HashtagSet[];
}
export interface HashtagSetResponse {
  hashtagSet: HashtagSet;
}

export async function listHashtagSets(
  supabase: SupabaseClient
): Promise<Result<HashtagSetsResponse>> {
  const { data, error } = await supabase
    .from('hashtag_sets')
    .select('*')
    .order('name', { ascending: true });
  if (error) return { error: error.message, status: 500 };
  return { hashtagSets: (data ?? []) as HashtagSet[] };
}

export async function createHashtagSet(
  supabase: SupabaseClient,
  input: unknown
): Promise<Result<HashtagSetResponse>> {
  let parsed;
  try {
    parsed = CreateHashtagSetInputSchema.parse(input);
  } catch (err) {
    return { error: (err as Error).message, status: 400 };
  }
  const { data, error } = await supabase.from('hashtag_sets').insert(parsed).select('*').single();
  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return { error: error.message, status };
  }
  return { hashtagSet: data as HashtagSet };
}

export async function updateHashtagSet(
  supabase: SupabaseClient,
  id: string,
  input: unknown
): Promise<Result<HashtagSetResponse>> {
  let parsed;
  try {
    parsed = UpdateHashtagSetInputSchema.parse(input);
  } catch (err) {
    return { error: (err as Error).message, status: 400 };
  }
  const { data, error } = await supabase
    .from('hashtag_sets')
    .update(parsed)
    .eq('id', id)
    .select('*')
    .single();
  if (error) return { error: error.message, status: 500 };
  if (!data) return { error: 'Hashtag set not found', status: 404 };
  return { hashtagSet: data as HashtagSet };
}

export async function deleteHashtagSet(
  supabase: SupabaseClient,
  id: string
): Promise<Result<{ success: true }>> {
  const { error } = await supabase.from('hashtag_sets').delete().eq('id', id);
  if (error) return { error: error.message, status: 500 };
  return { success: true };
}
