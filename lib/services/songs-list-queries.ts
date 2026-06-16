import { createClient } from '@/lib/supabase/server';
import { getSongsHandler, type SongQueryParams } from '@/app/api/song/handlers';
import type { Song } from '@/components/songs/types';

export type SongListLevel = 'beginner' | 'intermediate' | 'advanced';

/** Page size for the editorial songs list. */
export const SONGS_PAGE_SIZE = 50;

export type SongsListFilters = {
  level?: SongListLevel;
  key?: string;
  author?: string;
  search?: string;
  sort: 'newest' | 'oldest' | 'title';
  page: number;
};

export type SongsBreakdown = Record<SongListLevel | 'unset', number>;

export type SongsListResult = {
  songs: Song[];
  total: number;
  page: number;
  totalPages: number;
  breakdown: SongsBreakdown;
};

const LEVELS: SongListLevel[] = ['beginner', 'intermediate', 'advanced'];

function resolveSort(
  sort: SongsListFilters['sort']
): Pick<SongQueryParams, 'sortBy' | 'sortOrder'> {
  if (sort === 'title') return { sortBy: 'title', sortOrder: 'asc' };
  if (sort === 'oldest') return { sortBy: 'created_at', sortOrder: 'asc' };
  return { sortBy: 'created_at', sortOrder: 'desc' };
}

type SupabaseLike = Awaited<ReturnType<typeof createClient>>;

/**
 * Level counts for the filter chips. Respects key/author/search but ignores
 * the active `level` filter (so the user can see how many rows each level
 * holds before switching). Runs under the same RLS-scoped client as the list.
 */
async function loadBreakdown(
  supabase: SupabaseLike,
  filters: SongsListFilters
): Promise<SongsBreakdown> {
  let query = supabase.from('songs').select('level').is('deleted_at', null);
  if (filters.key) query = query.eq('key', filters.key);
  if (filters.author) query = query.eq('author', filters.author);
  const search = filters.search?.trim();
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error } = await query;
  if (error) {
    throw new Error(`songs breakdown query failed: ${error.message}`);
  }

  const breakdown: SongsBreakdown = { beginner: 0, intermediate: 0, advanced: 0, unset: 0 };
  for (const row of data ?? []) {
    const lvl = (row as { level: string | null }).level as SongListLevel | null;
    if (lvl && LEVELS.includes(lvl)) breakdown[lvl] += 1;
    else breakdown.unset += 1;
  }
  return breakdown;
}

/**
 * List songs for the editorial list page.
 *
 * Reads through an RLS-respecting client (`createClient`) so the database —
 * not app code — scopes the result: admin/teacher see all non-deleted songs,
 * students see only songs tied to them via `lesson_songs → lessons`
 * (ADR-0001 / `songs_select_policy`). We do NOT re-filter by role here.
 *
 * Errors are surfaced (thrown → caught by the route error boundary), never
 * swallowed into an empty list.
 */
export async function getSongsForList(
  user: { id: string },
  roles: { isAdmin: boolean; isTeacher: boolean; isStudent: boolean },
  filters: SongsListFilters
): Promise<SongsListResult> {
  const supabase = await createClient();
  const profile = { isAdmin: roles.isAdmin, isTeacher: roles.isTeacher };
  const page = Math.max(1, filters.page || 1);

  const params: SongQueryParams = {
    ...resolveSort(filters.sort),
    level: filters.level,
    key: filters.key,
    author: filters.author,
    search: filters.search?.trim() || undefined,
    page,
    limit: SONGS_PAGE_SIZE,
  };

  const [result, breakdown] = await Promise.all([
    getSongsHandler(supabase, user, profile, params),
    loadBreakdown(supabase, filters),
  ]);

  if ('error' in result) {
    throw new Error(`songs list query failed: ${result.error}`);
  }

  const total = result.count ?? result.songs.length;
  const totalPages = Math.max(1, Math.ceil(total / SONGS_PAGE_SIZE));

  return { songs: result.songs, total, page, totalPages, breakdown };
}
