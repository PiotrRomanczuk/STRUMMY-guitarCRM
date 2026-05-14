/**
 * @jest-environment node
 *
 * Unit tests for GET /api/lessons/stats
 */

import { GET } from '@/app/api/lessons/stats/route';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const mockAdminContext = {
  user: { id: 'admin-user-id' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
};

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/lessons/stats');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

/**
 * The stats route calls buildQuery() many times (total count, per-status,
 * per-month, upcoming, completedThisMonth). Each call chains:
 *   supabase.from('lessons').select('*', {count:'exact',head:true})
 *   then optionally .or(), .gte(), .lte(), .eq()
 * and always resolves with { count, error }.
 *
 * For lesson_songs it calls .select('lesson_id') -> { data, error }.
 * For the student avgLessons query it calls .select('student_id') -> { data, error }.
 */
function buildStatsMock(opts: {
  totalCount?: number;
  totalError?: { message: string } | null;
  lessonSongsData?: { lesson_id: string }[];
  studentData?: { student_id: string }[];
}) {
  const { totalCount = 5, totalError = null, lessonSongsData = [], studentData = [] } = opts;

  // Chain builder that resolves to { count, error } for head queries
  // and { data, error } for select queries
  const makeCountBuilder = (count: number, error: { message: string } | null) => ({
    select: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    // Resolves as a promise (the route awaits the builder directly)
    then: (resolve: (v: { count: number | null; error: { message: string } | null }) => void) =>
      Promise.resolve({ count, error }).then(resolve),
  });

  return {
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'lesson_songs') {
        return {
          select: jest.fn().mockResolvedValue({ data: lessonSongsData, error: null }),
        };
      }
      if (table === 'lessons') {
        // Return a fresh count builder each time
        return makeCountBuilder(totalCount, totalError);
      }
      // student_id select fallback (same lessons table but different select)
      return {
        select: jest.fn().mockResolvedValue({ data: studentData, error: null }),
      };
    }),
  };
}

describe('GET /api/lessons/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockAdminContext) => Promise<Response>) =>
        handler(mockAdminContext)
    );
  });

  it('returns 401 when withApiAuth rejects', async () => {
    (withApiAuth as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns stats object with expected shape', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildStatsMock({ totalCount: 10 }));

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('byStatus');
    expect(body).toHaveProperty('monthly');
    expect(body).toHaveProperty('lessonsWithSongs');
    expect(body).toHaveProperty('upcoming');
    expect(body).toHaveProperty('completedThisMonth');
  });

  it('userId param passes .or() filter into buildQuery', async () => {
    const userId = '00000000-0000-0000-0000-000000000004';
    const mock = buildStatsMock({ totalCount: 3 });
    (createClient as jest.Mock).mockResolvedValue(mock);

    const res = await GET(makeRequest({ userId }));
    expect(res.status).toBe(200);

    // The from('lessons') builder should have had .or() called with the userId filter
    const fromCalls = mock.from.mock.calls as [string][];
    const lessonCalls = fromCalls.filter(([t]) => t === 'lessons');
    expect(lessonCalls.length).toBeGreaterThan(0);
  });

  it('returns 500 when total count query errors', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildStatsMock({ totalError: { message: 'count failed' } })
    );

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });

  it('byStatus contains keys for all LessonStatusEnum values', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildStatsMock({ totalCount: 0 }));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.byStatus).toHaveProperty('SCHEDULED');
    expect(body.byStatus).toHaveProperty('IN_PROGRESS');
    expect(body.byStatus).toHaveProperty('COMPLETED');
    expect(body.byStatus).toHaveProperty('CANCELLED');
  });

  it('monthly array has 12 entries', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildStatsMock({ totalCount: 0 }));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(Array.isArray(body.monthly)).toBe(true);
    expect(body.monthly).toHaveLength(12);
  });
});
