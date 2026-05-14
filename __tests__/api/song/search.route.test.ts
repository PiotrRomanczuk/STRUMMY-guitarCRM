// @jest-environment node

import { GET, sanitizePostgrestFilter } from '@/app/api/song/search/route';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }),
}));

const adminCtx = {
  user: { id: 'a1b2c3d4-0000-4000-8000-000000000001' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isDevelopment: false },
};

function makeRequest(params: Record<string, string>): NextRequest {
  const sp = new URLSearchParams(params).toString();
  return new NextRequest(`http://localhost/api/song/search?${sp}`);
}

function buildSearchClient(options: {
  songs?: unknown[];
  count?: number;
  error?: { message: string } | null;
}) {
  const { songs = [], count = 0, error = null } = options;
  const result = { data: songs, count, error };

  const order = jest.fn().mockResolvedValue(result);
  const range = jest.fn().mockReturnValue({ order });
  const ilike = jest.fn().mockReturnValue({ range });
  const eq = jest.fn().mockReturnValue({ range });
  const orFn = jest.fn().mockReturnValue({ range });
  const notFn = jest.fn().mockReturnValue({ range });

  // Build a fluent mock that supports chaining any combination
  const chain: Record<string, jest.Mock> = {
    order,
    range,
    ilike: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
  };
  // Override range/order to terminate
  chain.range = jest.fn().mockReturnValue({ order });

  const select = jest.fn().mockReturnValue(chain);
  const from = jest.fn().mockReturnValue({ select });
  return { from, _chain: chain };
}

beforeEach(() => {
  jest.clearAllMocks();
  (withApiAuth as jest.Mock).mockImplementation(
    async (_req: unknown, handler: (ctx: typeof adminCtx) => unknown) => handler(adminCtx)
  );
});

// ── sanitizePostgrestFilter unit tests ────────────────────────────────────────

describe('sanitizePostgrestFilter', () => {
  it('strips commas, dots, colons, parens, and percent signs', () => {
    expect(sanitizePostgrestFilter('a,b.c:d(e)f%g')).toBe('abcdefg');
  });

  it('leaves alphanumeric and spaces intact', () => {
    expect(sanitizePostgrestFilter('Hello World 123')).toBe('Hello World 123');
  });

  it('handles empty string', () => {
    expect(sanitizePostgrestFilter('')).toBe('');
  });

  it('returns empty string when input contains only special chars', () => {
    expect(sanitizePostgrestFilter(',.:(%).')).toBe('');
  });

  it('does not strip hyphens or underscores', () => {
    expect(sanitizePostgrestFilter('my-song_title')).toBe('my-song_title');
  });
});

// ── GET route tests ───────────────────────────────────────────────────────────

describe('GET /api/song/search', () => {
  it('returns paginated songs', async () => {
    const songs = [{ id: 'song-1', title: 'Blackbird' }];
    const client = buildSearchClient({ songs, count: 1 });
    (createClient as jest.Mock).mockResolvedValue(client);

    const res = await GET(makeRequest({ page: '1', limit: '10' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.songs).toEqual(songs);
    expect(body.pagination.page).toBe(1);
    expect(body.pagination.total).toBe(1);
  });

  it('returns 400 for invalid pagination (page=0)', async () => {
    const res = await GET(makeRequest({ page: '0', limit: '10' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid pagination');
  });

  it('applies sanitized search via .or() when q param provided', async () => {
    const client = buildSearchClient({ songs: [], count: 0 });
    (createClient as jest.Mock).mockResolvedValue(client);

    await GET(makeRequest({ q: 'wonderwall' }));
    const orCalls = client._chain.or.mock.calls;
    expect(orCalls.length).toBeGreaterThan(0);
    expect(orCalls[0][0]).toContain('wonderwall');
  });

  it('applies level, key, author filters as .eq()', async () => {
    const client = buildSearchClient({ songs: [], count: 0 });
    (createClient as jest.Mock).mockResolvedValue(client);

    await GET(makeRequest({ level: 'beginner', key: 'C' }));
    const eqCalls: [string, string][] = client._chain.eq.mock.calls;
    const eqFields = eqCalls.map((c) => c[0]);
    expect(eqFields).toContain('level');
    expect(eqFields).toContain('key');
  });

  it('returns 500 on DB error', async () => {
    const client = buildSearchClient({ error: { message: 'db error' } });
    // Make order return the error result
    client._chain.range = jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: null, count: 0, error: { message: 'db error' } }),
    });
    (createClient as jest.Mock).mockResolvedValue(client);

    const res = await GET(makeRequest({}));
    expect(res.status).toBe(500);
  });
});
