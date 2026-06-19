/**
 * Tests for recurring-event per-instance deduplication (spec 7.4).
 *
 * When singleEvents:true is set, Google expands a recurring series into
 * individual instances whose ids are "<baseId>_<startTimestamp>".  Each
 * instance must be stored as a distinct lesson; deduplication must key on
 * the per-instance id, not on the base recurring-event id.
 */

import { syncGoogleEventsForUser } from '@/lib/services/google-calendar-sync';
import type { ImportEvent } from '@/lib/services/google-calendar-sync';
import { createAdminClient } from '@/lib/supabase/admin';

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

jest.mock('@/lib/services/import-utils', () => ({
  matchStudentByEmail: jest.fn(),
  createShadowStudent: jest.fn(),
}));

jest.mock('@/lib/services/calendar-bulk-import', () => ({
  resolveStudentAttendee: jest.fn(),
}));

import { matchStudentByEmail } from '@/lib/services/import-utils';

/** Three instances of the same weekly recurring event. */
const BASE_ID = 'abc123recurring';
const WEEKLY_INSTANCES: ImportEvent[] = [
  {
    googleEventId: `${BASE_ID}_20260101T100000Z`,
    title: 'Guitar Lesson',
    startTime: '2026-01-01T10:00:00Z',
    attendeeEmail: 'student@example.com',
  },
  {
    googleEventId: `${BASE_ID}_20260108T100000Z`,
    title: 'Guitar Lesson',
    startTime: '2026-01-08T10:00:00Z',
    attendeeEmail: 'student@example.com',
  },
  {
    googleEventId: `${BASE_ID}_20260115T100000Z`,
    title: 'Guitar Lesson',
    startTime: '2026-01-15T10:00:00Z',
    attendeeEmail: 'student@example.com',
  },
];

function buildSupabaseMock(existingIds: Set<string>) {
  const insertedIds: string[] = [];

  const chainable = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockImplementation(() => {
      // Resolve the last .eq('google_event_id', ...) call's argument
      const eqCalls = chainable.eq.mock.calls;
      const lastGEIdCall = [...eqCalls].reverse().find(([col]) => col === 'google_event_id');
      const id = lastGEIdCall?.[1] as string | undefined;
      if (id && existingIds.has(id)) {
        return Promise.resolve({ data: { id: 'existing-lesson' }, error: null });
      }
      return Promise.resolve({ data: null, error: { code: 'PGRST116' } });
    }),
    insert: jest.fn().mockImplementation((row: { google_event_id: string }) => {
      insertedIds.push(row.google_event_id);
      return Promise.resolve({ error: null });
    }),
  };

  const supabase = {
    from: jest.fn(() => chainable),
    _insertedIds: insertedIds,
  };

  return supabase;
}

describe('calendar-recurring: per-instance deduplication (7.4)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (matchStudentByEmail as jest.Mock).mockResolvedValue({
      status: 'MATCHED',
      candidates: [{ id: 'student-uuid-1' }],
    });
  });

  it('imports all N instances of a recurring series as distinct lessons', async () => {
    const supabase = buildSupabaseMock(new Set());
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const result = await syncGoogleEventsForUser('teacher-id', WEEKLY_INSTANCES);

    expect(result.success).toBe(true);
    const successes = result.results.filter((r) => r.success);
    expect(successes).toHaveLength(3);

    // Each per-instance id must have been inserted separately
    const inserted = supabase._insertedIds;
    expect(inserted).toContain(`${BASE_ID}_20260101T100000Z`);
    expect(inserted).toContain(`${BASE_ID}_20260108T100000Z`);
    expect(inserted).toContain(`${BASE_ID}_20260115T100000Z`);
  });

  it('skips already-imported instances without blocking the others', async () => {
    // First instance already in DB
    const existing = new Set([`${BASE_ID}_20260101T100000Z`]);
    const supabase = buildSupabaseMock(existing);
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const result = await syncGoogleEventsForUser('teacher-id', WEEKLY_INSTANCES);

    expect(result.success).toBe(true);
    const successes = result.results.filter((r) => r.success);
    // 2 new, 1 skipped
    expect(successes).toHaveLength(2);
    expect(supabase._insertedIds).not.toContain(`${BASE_ID}_20260101T100000Z`);
    expect(supabase._insertedIds).toContain(`${BASE_ID}_20260108T100000Z`);
    expect(supabase._insertedIds).toContain(`${BASE_ID}_20260115T100000Z`);
  });

  it('does not collapse a recurring series to a single lesson', async () => {
    const supabase = buildSupabaseMock(new Set());
    (createAdminClient as jest.Mock).mockReturnValue(supabase);

    const result = await syncGoogleEventsForUser('teacher-id', WEEKLY_INSTANCES);

    // Must NOT have only 1 success (which would indicate base-id deduplication)
    expect(result.results.filter((r) => r.success).length).toBeGreaterThan(1);
  });
});
