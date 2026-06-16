import type { SongListLevel, SongsListFilters } from '@/lib/services/songs-list-queries';

export const LEVELS: SongListLevel[] = ['beginner', 'intermediate', 'advanced'];

export const SORTS: SongsListFilters['sort'][] = ['newest', 'oldest', 'title'];

export const SORT_LABEL: Record<SongsListFilters['sort'], string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  title: 'Alphabetical',
};

/** All musical keys offered as a filter (mirrors the edit form). */
export const KEYS = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
  'Cm',
  'C#m',
  'Dm',
  'D#m',
  'Em',
  'Fm',
  'F#m',
  'Gm',
  'G#m',
  'Am',
  'A#m',
  'Bm',
] as const;

/**
 * Build a `/dashboard/songs` href from the current filters plus an override.
 * Changing any filter (other than `page`) resets pagination to page 1.
 */
export const buildHref = (next: Partial<SongsListFilters>, current: SongsListFilters): string => {
  const merged = { ...current, ...next };
  const resetsPage = !('page' in next);
  const params = new URLSearchParams();
  if (merged.level) params.set('level', merged.level);
  if (merged.key) params.set('key', merged.key);
  if (merged.author) params.set('author', merged.author);
  if (merged.search) params.set('search', merged.search);
  if (merged.sort !== 'newest') params.set('sort', merged.sort);
  const page = resetsPage ? 1 : merged.page;
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/dashboard/songs?${qs}` : '/dashboard/songs';
};
