/**
 * URL-param helpers for the editorial Lessons list. Every filter/sort control is
 * a plain `<Link>` (Server-Component friendly), so each one just rebuilds the
 * `/dashboard/lessons` query string from the current state with one field
 * overridden. Keeping this pure makes the href logic unit-testable in isolation.
 *
 * View model: with no `sort=` param the list stays grouped by time bucket
 * (Today / This week / …). Activating the sort toggle adds `sort=` and flips the
 * list into a flat, fully-sorted table (the mockup layout). `flat` therefore
 * means "a sort param is present". The year filter is independent — it narrows
 * the query in either view and is preserved across every link.
 */

export const STATUS_KEYS = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;

export type LessonsSort = 'newest' | 'oldest';

export type LessonsListState = {
  statuses: string[];
  sort: LessonsSort;
  /** Undefined = no year filter (all years). */
  year?: number;
  /** True once a `sort=` param is present — flips grouped → flat sorted table. */
  flat: boolean;
};

const buildHref = (
  statuses: string[],
  sort: LessonsSort,
  year: number | undefined,
  emitSort: boolean
): string => {
  const params = new URLSearchParams();
  if (statuses.length > 0 && statuses.length < STATUS_KEYS.length) {
    params.set('status', statuses.join(','));
  }
  if (emitSort) params.set('sort', sort);
  if (year !== undefined) params.set('year', String(year));
  const qs = params.toString();
  return qs ? `/dashboard/lessons?${qs}` : '/dashboard/lessons';
};

/** Toggle one status on/off, preserving sort + year (and the flat/grouped view). */
export const statusHref = (state: LessonsListState, toggle: string): string => {
  const next = state.statuses.includes(toggle)
    ? state.statuses.filter((s) => s !== toggle)
    : [...state.statuses, toggle];
  return buildHref(next, state.sort, state.year, state.flat);
};

/** Flip newest <-> oldest; always enters/stays in the flat sorted table. */
export const sortHref = (state: LessonsListState): string => {
  const next: LessonsSort = state.sort === 'newest' ? 'oldest' : 'newest';
  return buildHref(state.statuses, next, state.year, true);
};

/** Set (or clear, when `year` is undefined) the year filter, preserving the rest. */
export const yearHref = (state: LessonsListState, year: number | undefined): string =>
  buildHref(state.statuses, state.sort, year, state.flat);

/** Years offered in the filter row: the current year and the two prior. */
export const yearOptions = (now: Date): number[] => {
  const current = now.getUTCFullYear();
  return [current, current - 1, current - 2];
};
