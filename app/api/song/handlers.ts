// Pure functions for song API business logic - testable without Next.js dependencies

import type { Song } from '@/components/songs/types';
import { SongInputSchema, SongDraftSchema } from '@/schemas/SongSchema';
import { ZodError } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { validateMutationPermission } from '@/lib/auth/permissions';
import { applySortAndPagination } from '@/lib/database/query-helpers';

// Re-export so existing imports from this module continue to work
export { validateMutationPermission } from '@/lib/auth/permissions';

export interface SongQueryParams {
  level?: string;
  key?: string;
  author?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface SongResponse {
  songs: Song[];
  count?: number;
}

export interface SongError {
  error: string;
  status: number;
}

export type SongResult = SongResponse | SongError;

export interface AuthResult {
  user: { id: string } | null;
  profile: { isAdmin?: boolean; isTeacher?: boolean } | null;
  error?: string;
}

/**
 * Validate sort field to prevent injection
 */
function validateSortField(sortBy?: string): string {
  const validSortFields = ['created_at', 'updated_at', 'title', 'author', 'level', 'key'];
  return validSortFields.includes(sortBy || '') ? sortBy! : 'created_at';
}

/**
 * Apply filters to Supabase query
 */
function applyFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  params: { level?: string; key?: string; author?: string; search?: string }
) {
  let result = query;
  if (params.level) result = result.eq('level', params.level);
  if (params.key) result = result.eq('key', params.key);
  if (params.author) result = result.eq('author', params.author);
  if (params.search) result = result.ilike('title', `%${params.search}%`);
  return result;
}

export async function getSongsHandler(
  supabase: SupabaseClient,
  user: { id: string } | null,
  profile: { isAdmin?: boolean } | null,
  query: SongQueryParams
): Promise<SongResult> {
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const {
    level,
    key,
    author,
    search,
    page = 1,
    limit = 50,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = query;

  const validatedSortBy = validateSortField(sortBy);
  let dbQuery = supabase.from('songs').select('*', { count: 'exact' });

  // Filter out soft-deleted songs
  dbQuery = dbQuery.is('deleted_at', null);

  dbQuery = applyFilters(dbQuery, { level, key, author, search });
  dbQuery = applySortAndPagination(dbQuery, validatedSortBy, sortOrder, page, limit);

  const { data: songs, error, count } = await dbQuery;

  if (error) {
    return { error: error.message, status: 500 };
  }

  return { songs: songs || [], count: count ?? undefined, status: 200 };
}

export async function createSongHandler(
  supabase: SupabaseClient,
  user: { id: string } | null,
  profile: { isAdmin?: boolean; isTeacher?: boolean } | null,
  body: unknown
): Promise<{ song?: Song; error?: string; status: number }> {
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (!validateMutationPermission(profile)) {
    return {
      error: 'Forbidden: Only teachers and admins can create songs',
      status: 403,
    };
  }

  try {
    // Check if this is a draft and use appropriate schema
    const isDraft = (body as { is_draft?: boolean })?.is_draft === true;
    const schema = isDraft ? SongDraftSchema : SongInputSchema;
    const validatedSong = schema.parse(body);

    const { data: song, error } = await supabase
      .from('songs')
      .insert(validatedSong)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return {
          error: 'A song with this title and author already exists',
          status: 409,
        };
      }
      logger.error('Supabase insert error:', error.message);
      return { error: error.message, status: 500 };
    }

    return { song, status: 201 };
  } catch (err) {
    if (err instanceof ZodError) {
      const fieldErrors = err.flatten().fieldErrors;
      return {
        error: `Validation failed: ${JSON.stringify(fieldErrors)}`,
        status: 422,
      };
    }
    return { error: 'Internal server error', status: 500 };
  }
}

export async function updateSongHandler(
  supabase: SupabaseClient,
  user: { id: string } | null,
  profile: { isAdmin?: boolean; isTeacher?: boolean } | null,
  songId: string,
  body: unknown
): Promise<{ song?: Song; error?: string; status: number }> {
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (!validateMutationPermission(profile)) {
    return {
      error: 'Forbidden: Only teachers and admins can update songs',
      status: 403,
    };
  }

  try {
    // Check if this is a draft and use appropriate schema
    const isDraft = (body as { is_draft?: boolean })?.is_draft === true;
    const schema = isDraft ? SongDraftSchema : SongInputSchema;
    const validatedSong = schema.parse(body);

    const updateData = {
      ...validatedSong,
      updated_at: new Date().toISOString(),
    };

    const { data: song, error } = await supabase
      .from('songs')
      .update(updateData)
      .eq('id', songId)
      .select()
      .single();

    if (error) {
      return { error: error.message, status: 500 };
    }

    return { song, status: 200 };
  } catch (err) {
    if (err instanceof ZodError) {
      const fieldErrors = err.flatten().fieldErrors;
      return {
        error: `Validation failed: ${JSON.stringify(fieldErrors)}`,
        status: 422,
      };
    }
    return { error: 'Internal server error', status: 500 };
  }
}

export interface CascadeInfo {
  // Number of lesson-song assignment rows soft-deleted as part of cascade
  lessonSongsDeleted: number;
  // Number of user favorite rows soft-deleted as part of cascade
  userFavoritesDeleted: number;
}

export async function deleteSongHandler(
  supabase: SupabaseClient,
  user: { id: string } | null,
  profile: { isAdmin?: boolean; isTeacher?: boolean } | null,
  songId: string
): Promise<{ success?: boolean; error?: string; status: number; cascadeInfo?: CascadeInfo }> {
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (!validateMutationPermission(profile)) {
    return {
      error: 'Forbidden: Only teachers and admins can delete songs',
      status: 403,
    };
  }

  try {
    // Call the database function for soft delete with cascade
    const { data, error } = await supabase.rpc('soft_delete_song_with_cascade', {
      song_uuid: songId,
      user_uuid: user.id,
    });

    if (error) {
      logger.error('Database error during song deletion:', error);
      return { error: error.message, status: 500 };
    }

    if (!data.success) {
      return { error: data.error, status: 400 };
    }

    return {
      success: true,
      status: 200,
      cascadeInfo: {
        lessonSongsDeleted: data.lesson_assignments_removed,
        userFavoritesDeleted: data.favorite_assignments_removed,
      },
    };
  } catch (err) {
    logger.error('Unexpected error during song deletion:', err);
    return { error: 'Internal server error', status: 500 };
  }
}
