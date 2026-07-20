/**
 * Unit tests for `fetchRepertoireForDashboard`.
 *
 * @see app/actions/student/dashboard.repertoire.ts
 *
 * No module mocks needed — the Supabase client arrives as a function argument,
 * so the whole file is exercised through a hand-rolled chain object.
 */

import { fetchRepertoireForDashboard } from '../student/dashboard.repertoire';
import type { SupabaseClient } from '@supabase/supabase-js';

const STUDENT_ID = '123e4567-e89b-12d3-a456-426614174000';

type TableResult = { data?: unknown; count?: number };

/**
 * Build a Supabase stand-in whose `from()` chain resolves to a per-call result.
 * `fetchRepertoireForDashboard` issues three queries against `student_repertoire`
 * in order: rows, head-count, practice-minutes.
 */
function createSupabase(results: TableResult[]): SupabaseClient {
  let call = 0;
  const from = jest.fn(() => {
    const result = results[call++] ?? {};
    const chain: Record<string, unknown> = {};
    for (const method of ['select', 'eq', 'order']) {
      chain[method] = jest.fn(() => chain);
    }
    // `.limit()` and the head-count `.eq()` are the terminals — both are awaited.
    chain.limit = jest.fn(() => Promise.resolve(result));
    chain.eq = jest.fn(() => Object.assign(Promise.resolve(result), chain));
    return chain;
  });
  return { from } as unknown as SupabaseClient;
}

const row = (over: Record<string, unknown> = {}) => ({
  id: 'r1',
  song_id: 's1',
  current_status: 'LEARNING',
  priority: 'HIGH',
  last_practiced_at: '2026-07-01T00:00:00Z',
  total_practice_minutes: 90,
  self_rating: 4,
  song: { id: 's1', title: 'Wonderwall', author: 'Oasis' },
  ...over,
});

describe('fetchRepertoireForDashboard', () => {
  it('maps repertoire rows and aggregates stats', async () => {
    const supabase = createSupabase([
      { data: [row()] },
      { count: 7 },
      { data: [{ total_practice_minutes: 90 }, { total_practice_minutes: 30 }] },
    ]);

    const result = await fetchRepertoireForDashboard(supabase, STUDENT_ID);

    expect(result.repertoire).toEqual([
      {
        id: 'r1',
        song_id: 's1',
        song_title: 'Wonderwall',
        song_author: 'Oasis',
        current_status: 'LEARNING',
        priority: 'HIGH',
        last_practiced_at: '2026-07-01T00:00:00Z',
        total_practice_minutes: 90,
        self_rating: 4,
      },
    ]);
    expect(result.totalSongs).toBe(7);
    expect(result.practiceHours).toBe(2); // 120 minutes, rounded
  });

  it('unwraps an array-shaped song join', async () => {
    const supabase = createSupabase([
      { data: [row({ song: [{ id: 's1', title: 'Creep', author: 'Radiohead' }] })] },
      { count: 1 },
      { data: [] },
    ]);

    const { repertoire } = await fetchRepertoireForDashboard(supabase, STUDENT_ID);

    expect(repertoire[0].song_title).toBe('Creep');
    expect(repertoire[0].song_author).toBe('Radiohead');
  });

  it('falls back when the song join is missing and minutes are null', async () => {
    const supabase = createSupabase([
      { data: [row({ song: null, total_practice_minutes: null })] },
      { count: 1 },
      { data: [{ total_practice_minutes: null }] },
    ]);

    const { repertoire, practiceHours } = await fetchRepertoireForDashboard(supabase, STUDENT_ID);

    expect(repertoire[0].song_title).toBe('');
    expect(repertoire[0].song_author).toBeNull();
    expect(repertoire[0].total_practice_minutes).toBe(0);
    expect(practiceHours).toBe(0);
  });

  it('returns empty results when every query comes back null', async () => {
    const supabase = createSupabase([{ data: null }, { count: null }, { data: null }]);

    expect(await fetchRepertoireForDashboard(supabase, STUDENT_ID)).toEqual({
      repertoire: [],
      totalSongs: 0,
      practiceHours: 0,
    });
  });
});
