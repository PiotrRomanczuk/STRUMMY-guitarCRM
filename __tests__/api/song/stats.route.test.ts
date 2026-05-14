// @jest-environment node

import { GET } from '@/app/api/song/stats/route';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { NextResponse } from 'next/server';

jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }),
}));

const adminCtx = {
  user: { id: 'a1b2c3d4-0000-4000-8000-000000000001' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isDevelopment: false },
};

const teacherCtx = {
  user: { id: 'a1b2c3d4-0000-4000-8000-000000000002' },
  roles: { isAdmin: false, isTeacher: true, isStudent: false },
  flags: { isDevelopment: false },
};

// Build a mock admin client that returns sensible data for all the stats queries
function buildStatsAdminClient() {
  // Stats route calls createAdminClient() (sync) and chains multiple from(...).select(...) calls.
  // Each call may end with .not(...).is(null) or .gte(...) or no filter — then resolved.
  // We return a chainable mock that resolves with sensible defaults.

  const makeChain = (resolvedValue: unknown) => {
    const chain: Record<string, jest.Mock> = {};
    const methods = ['select', 'not', 'gte', 'order', 'limit', 'single', 'eq', 'is'];
    for (const m of methods) {
      chain[m] = jest.fn().mockReturnValue(chain);
    }
    // Make the chain thenable so `await chain` works
    chain.then = jest.fn((resolve: (v: unknown) => unknown) =>
      Promise.resolve(resolvedValue).then(resolve)
    );
    chain.catch = jest.fn((fn: (e: unknown) => unknown) => Promise.resolve().catch(fn));
    return chain;
  };

  let callIndex = 0;
  // The stats route makes these queries (in order):
  // 1. songs count (total)    → { count: 42, error: null }
  // 2. songs by level         → { data: [{ level: 'beginner' }, { level: 'advanced' }] }
  // 3. songs by key           → { data: [{ key: 'C' }, { key: 'G' }] }
  // 4. songs with audio       → { count: 10 }
  // 5. songs with chords      → { count: 20 }
  // 6. top authors            → { data: [{ author: 'Beatles' }, { author: 'Eagles' }] }
  // 7. recent songs count     → { count: 5 }
  const responses = [
    { count: 42, error: null, data: null },
    { data: [{ level: 'beginner' }, { level: 'advanced' }], error: null },
    { data: [{ key: 'C' }, { key: 'G' }], error: null },
    { count: 10, error: null, data: null },
    { count: 20, error: null, data: null },
    { data: [{ author: 'Beatles' }, { author: 'Eagles' }], error: null },
    { count: 5, error: null, data: null },
  ];

  const from = jest.fn().mockImplementation(() => {
    const resp = responses[callIndex] ?? { data: [], error: null, count: 0 };
    callIndex++;
    return makeChain(resp);
  });

  return { from };
}

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

import { createAdminClient } from '@/lib/supabase/admin';

beforeEach(() => {
  jest.clearAllMocks();
  (withApiAuth as jest.Mock).mockImplementation(
    async (_req: unknown, handler: (ctx: typeof adminCtx) => unknown) => handler(adminCtx)
  );
});

describe('GET /api/song/stats', () => {
  it('returns 401 when not authenticated', async () => {
    (withApiAuth as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
    const res = await GET(new Request('http://localhost/api/song/stats'));
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin role', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof teacherCtx) => unknown) => handler(teacherCtx)
    );
    const res = await GET(new Request('http://localhost/api/song/stats'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  it('returns stats object for admin', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(buildStatsAdminClient());
    const res = await GET(new Request('http://localhost/api/song/stats'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('totalSongs');
    expect(body).toHaveProperty('levelStats');
    expect(body).toHaveProperty('keyStats');
    expect(body).toHaveProperty('songsWithAudio');
    expect(body).toHaveProperty('songsWithChords');
    expect(body).toHaveProperty('topAuthorsList');
    expect(body).toHaveProperty('recentSongs');
  });

  it('returns totalSongs from count query', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(buildStatsAdminClient());
    const res = await GET(new Request('http://localhost/api/song/stats'));
    const body = await res.json();
    expect(body.totalSongs).toBe(42);
  });

  it('aggregates level stats from songs', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(buildStatsAdminClient());
    const res = await GET(new Request('http://localhost/api/song/stats'));
    const body = await res.json();
    expect(body.levelStats).toHaveProperty('beginner');
    expect(body.levelStats).toHaveProperty('advanced');
  });

  it('returns 500 on unexpected exception', async () => {
    (createAdminClient as jest.Mock).mockImplementation(() => {
      throw new Error('connection refused');
    });
    const res = await GET(new Request('http://localhost/api/song/stats'));
    expect(res.status).toBe(500);
  });
});
