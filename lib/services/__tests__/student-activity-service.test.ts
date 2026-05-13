/**
 * Student Activity Service — Smoke Test
 *
 * Purpose: catch schema/column drift at CI time. The function previously
 * referenced a `profiles.deleted_at` column that does not exist on prod,
 * which made the daily cron silently throw for months (see #328).
 *
 * This test runs the real function code against a mocked Supabase client
 * and asserts the function does not throw and returns a result with the
 * expected shape. It is intentionally NOT a deep unit test of the
 * status-transition logic — that's a separate concern.
 */

import { updateStudentActivityStatus } from '../student-activity-service';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('student-activity-service (smoke)', () => {
  // Chainable supabase client mock. Every builder method returns `mock`
  // itself so the chain composes; terminal calls (`.in`, `.single`,
  // `.eq` on `.update`) are stubbed per test where needed.
  const buildMockSupabase = () => {
    const mock = {
      from: jest.fn(),
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      eq: jest.fn(),
      in: jest.fn(),
      is: jest.fn(),
      gte: jest.fn(),
      order: jest.fn(),
      limit: jest.fn(),
      single: jest.fn(),
    };

    mock.from.mockReturnValue(mock);
    mock.select.mockReturnValue(mock);
    mock.insert.mockResolvedValue({ error: null });
    mock.update.mockReturnValue(mock);
    mock.eq.mockReturnValue(mock);
    mock.is.mockReturnValue(mock);
    mock.gte.mockReturnValue(mock);
    mock.order.mockReturnValue(mock);
    mock.limit.mockReturnValue(mock);

    return mock;
  };

  let mockSupabase: ReturnType<typeof buildMockSupabase>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = buildMockSupabase();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('returns the expected result shape when no students match', async () => {
    // Terminal call for profiles fetch chain ends on `.in(...)`
    mockSupabase.in.mockResolvedValueOnce({ data: [], error: null });

    const result = await updateStudentActivityStatus();

    expect(result).toEqual({
      processed: 0,
      activatedCount: 0,
      deactivatedCount: 0,
      activated: [],
      deactivated: [],
    });
    expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
  });

  it('processes returned students without throwing', async () => {
    const students = [
      { id: 'a', email: 'a@x.com', full_name: 'A', student_status: 'active' },
      { id: 'b', email: 'b@x.com', full_name: 'B', student_status: 'archived' },
    ];
    mockSupabase.in.mockResolvedValueOnce({ data: students, error: null });

    // Each student triggers two `.single()` lookups (last completed, next
    // scheduled). Return "no rows" for all of them so no status change
    // fires and the test stays a pure smoke check.
    mockSupabase.single.mockResolvedValue({ data: null, error: null });

    const result = await updateStudentActivityStatus();

    expect(result.processed).toBe(students.length);
    expect(result).toMatchObject({
      processed: expect.any(Number),
      activatedCount: expect.any(Number),
      deactivatedCount: expect.any(Number),
      activated: expect.any(Array),
      deactivated: expect.any(Array),
    });
  });

  it('throws a helpful error when the profiles fetch fails', async () => {
    // This is the exact failure mode from #328 — column drift causes
    // Supabase to return an error here. Make sure we still surface it
    // loudly instead of returning a zeroed result.
    mockSupabase.in.mockResolvedValueOnce({
      data: null,
      error: { message: 'column profiles.deleted_at does not exist', code: '42703' },
    });

    await expect(updateStudentActivityStatus()).rejects.toThrow(/Failed to fetch students/);
  });
});
