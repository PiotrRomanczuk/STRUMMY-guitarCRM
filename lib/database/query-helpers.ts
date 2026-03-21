/**
 * Shared Supabase query helpers for sorting and pagination.
 *
 * These utilities are used across API handlers (lessons, songs, etc.)
 * to apply consistent sort ordering and offset-based pagination.
 */

/**
 * Supabase query builder interface for the subset of methods we use.
 * This avoids importing the full Supabase client types and eliminates
 * the need for `any` in handler files.
 */
export interface SupabaseQueryBuilder {
  order: (column: string, options: { ascending: boolean }) => SupabaseQueryBuilder;
  range: (from: number, to: number) => SupabaseQueryBuilder;
}

/**
 * Apply sorting and pagination to a Supabase query builder.
 *
 * @param query - A Supabase query builder (must have `.order()` and `.range()`)
 * @param sortBy - Column name to sort by
 * @param sortOrder - 'asc' or 'desc'
 * @param page - 1-based page number
 * @param limit - Number of rows per page
 * @returns The query with sort and pagination applied
 */
export function applySortAndPagination<T extends SupabaseQueryBuilder>(
  query: T,
  sortBy: string,
  sortOrder: string,
  page: number,
  limit: number
): T {
  const ascending = sortOrder === 'asc';
  const offset = (page - 1) * limit;
  // Supabase's `.order()` and `.range()` return the same builder type
  return query.order(sortBy, { ascending }).range(offset, offset + limit - 1) as T;
}
