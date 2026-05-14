// @jest-environment node

import { GET as getAdminFavorites } from '@/app/api/song/admin-favorites/route';
import { GET as getAdminSongs } from '@/app/api/song/admin-songs/route';
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
const studentCtx = {
  user: { id: 'a1b2c3d4-0000-4000-8000-000000000003' },
  roles: { isAdmin: false, isTeacher: false, isStudent: true },
  flags: { isDevelopment: false },
};
const teacherCtx = {
  user: { id: 'a1b2c3d4-0000-4000-8000-000000000002' },
  roles: { isAdmin: false, isTeacher: true, isStudent: false },
  flags: { isDevelopment: false },
};

function makeRequest(url: string): NextRequest {
  return new NextRequest(url);
}

beforeEach(() => {
  jest.clearAllMocks();
  (withApiAuth as jest.Mock).mockImplementation(
    async (_req: unknown, handler: (ctx: typeof adminCtx) => unknown) => handler(adminCtx)
  );
});

// ── admin-favorites ───────────────────────────────────────────────────────────

describe('GET /api/song/admin-favorites', () => {
  function buildFavoritesClient(rows: unknown[], error: { message: string } | null = null) {
    const result = { data: rows, error };
    const eq = jest.fn().mockResolvedValue(result);
    const select = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ select });
    return { from };
  }

  it('returns 403 for non-admin', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof studentCtx) => unknown) => handler(studentCtx)
    );
    const res = await getAdminFavorites(makeRequest('http://localhost/api/song/admin-favorites'));
    expect(res.status).toBe(403);
  });

  it('returns flat array of songs from user_favorites', async () => {
    const rows = [
      { song: { id: 'song-1', title: 'Wonderwall' } },
      { song: { id: 'song-2', title: 'Hotel California' } },
    ];
    (createClient as jest.Mock).mockResolvedValue(buildFavoritesClient(rows));
    const res = await getAdminFavorites(makeRequest('http://localhost/api/song/admin-favorites'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].title).toBe('Wonderwall');
  });

  it('returns empty array on table-not-found error (message includes user_favorites)', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildFavoritesClient([], { message: 'relation "user_favorites" does not exist' })
    );
    const res = await getAdminFavorites(makeRequest('http://localhost/api/song/admin-favorites'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it('returns 500 on generic DB error', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildFavoritesClient([], { message: 'unexpected db failure' })
    );
    const res = await getAdminFavorites(makeRequest('http://localhost/api/song/admin-favorites'));
    expect(res.status).toBe(500);
  });
});

// ── admin-songs ───────────────────────────────────────────────────────────────

describe('GET /api/song/admin-songs', () => {
  function buildSongsClient(songs: unknown[], error: { message: string } | null = null) {
    const result = { data: songs, error };
    // chain: .select(...).eq?(...) or direct resolve
    const eq = jest.fn().mockResolvedValue(result);
    const select = jest.fn().mockReturnValue({ eq, then: undefined, ...result });
    // Make select itself thenable so await works when no .eq() is called
    const selectResult = {
      eq,
      // make it awaitable directly
      then: (res: (v: typeof result) => unknown) => Promise.resolve(result).then(res),
      catch: (fn: (e: unknown) => unknown) => Promise.resolve(result).catch(fn),
    };
    const from = jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue(selectResult) });
    return { from };
  }

  it('returns 403 for student/non-admin non-teacher', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof studentCtx) => unknown) => handler(studentCtx)
    );
    const res = await getAdminSongs(makeRequest('http://localhost/api/song/admin-songs'));
    expect(res.status).toBe(403);
  });

  it('returns songs array for admin', async () => {
    const songs = [{ id: 'song-1', title: 'Blackbird' }];
    (createClient as jest.Mock).mockResolvedValue(buildSongsClient(songs));
    const res = await getAdminSongs(makeRequest('http://localhost/api/song/admin-songs'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(songs);
  });

  it('applies level filter via .eq() when level param provided', async () => {
    const songs = [{ id: 'song-2', title: 'Easy Song', level: 'beginner' }];
    const eqMock = jest.fn().mockResolvedValue({ data: songs, error: null });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    const fromMock = jest.fn().mockReturnValue({ select: selectMock });
    (createClient as jest.Mock).mockResolvedValue({ from: fromMock });

    const res = await getAdminSongs(
      makeRequest('http://localhost/api/song/admin-songs?level=beginner')
    );
    expect(res.status).toBe(200);
    expect(eqMock).toHaveBeenCalledWith('level', 'beginner');
  });

  it('returns 500 on DB error', async () => {
    const selectResult = {
      eq: jest.fn(),
      then: (res: (v: unknown) => unknown) =>
        Promise.resolve({ data: null, error: { message: 'db fail' } }).then(res),
      catch: (fn: (e: unknown) => unknown) => Promise.resolve().catch(fn),
    };
    (createClient as jest.Mock).mockResolvedValue({
      from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue(selectResult) }),
    });
    const res = await getAdminSongs(makeRequest('http://localhost/api/song/admin-songs'));
    expect(res.status).toBe(500);
  });
});
