/**
 * Server-side dedup helpers for unbreakable-core scenarios:
 *   - notes:auto-save-no-double-write
 *   - create-lesson:gcal-dedup
 *
 * Pure functions: they take the persisted state + the incoming payload and
 * return a verdict ("skip", "merge", "proceed") without performing any
 * database writes. Routes can opt in by calling these before issuing the
 * mutation, which keeps the existing test mocks intact (no extra round-trips
 * are introduced unless the caller asks for it).
 */

/**
 * Returns true when the only requested change is a `notes` field whose new
 * value matches the persisted value (i.e. an auto-save replay). Routes
 * should treat that as a 200 no-op instead of writing through.
 *
 * Whitespace-only differences (trailing newline) are treated as a match
 * because most auto-save UIs canonicalise the value on render.
 *
 * @param current The currently-persisted lesson row (or null when not yet
 *                fetched — the helper returns false in that case so the
 *                caller falls through to the regular write path).
 * @param payload The validated PATCH payload as it would be applied.
 */
export function isNoOpNotesUpdate(
  current: { notes?: string | null } | null | undefined,
  payload: Record<string, unknown>
): boolean {
  if (!current) return false;
  const keys = Object.keys(payload);
  if (keys.length !== 1 || keys[0] !== 'notes') return false;
  const incoming = payload.notes;
  if (typeof incoming !== 'string' && incoming !== null) return false;
  const a = (current.notes ?? '').trim();
  const b = ((incoming ?? '') as string).trim();
  return a === b;
}

/**
 * Match an incoming create-lesson payload against any imported lesson at the
 * same `(student_id, scheduled_at)` slot. Returns the conflicting lesson's id
 * when a manual create would collide with a Google-Calendar-imported event so
 * the caller can choose to (a) reject with 409, (b) silently update the
 * imported row, or (c) proceed (manual wins, mark imported as duplicate).
 *
 * Pure function: takes the candidate-list as input. Callers are expected to
 * fetch with a query like
 *   .from('lessons').select('id, scheduled_at, student_id, is_imported')
 *     .eq('student_id', input.student_id)
 *     .eq('scheduled_at', input.scheduled_at)
 *     .eq('is_imported', true)
 */
export function findImportedConflict<
  T extends {
    id: string;
    scheduled_at: string;
    student_id: string;
    is_imported?: boolean | null;
  },
>(candidates: readonly T[], input: { student_id: string; scheduled_at: string }): T | null {
  for (const row of candidates) {
    if (
      row.is_imported === true &&
      row.student_id === input.student_id &&
      row.scheduled_at === input.scheduled_at
    ) {
      return row;
    }
  }
  return null;
}

/**
 * Build the stable idempotency key used by the in-memory cache for the
 * "double-click create" scenario. The user's id scopes the key so two users
 * can submit the same client_request_id concurrently without colliding.
 */
export function lessonCreateIdempotencyKey(userId: string, clientRequestId: string): string {
  return `lesson:create:${userId}:${clientRequestId}`;
}
