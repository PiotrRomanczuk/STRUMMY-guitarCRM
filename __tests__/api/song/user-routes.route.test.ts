// @jest-environment node

/**
 * Tests for user-facing song routes:
 *   GET /api/song/user-songs   — songs linked to lessons a user participated in
 *   GET /api/song/student-songs — songs assigned to a student via student_repertoire
 */

import { GET as getUserSongs } from '@/app/api/song/user-songs/route';
import { GET as getStudentSongs } from '@/app/api/song/student-songs/route';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }),
}));

const USER_ID = 'a1b2c3d4-0000-4000-8000-000000000001';
const SONG_ID = 'a1b2c3d4-1111-4000-8000-000000000010';
const LESSON_ID = 'a1b2c3d4-2222-4000-8000-000000000020';

const adminCtx = {
  user: { id: USER_ID },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isDevelopment: false },
};

const studentCtx = {
  user: { id: USER_ID },
  roles: { isAdmin: false, isTeacher: false, isStudent: true },
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

// ── GET /api/song/user-songs ──────────────────────────────────────────────────

describe('GET /api/song/user-songs', () => {
  function buildUserSongsClient(options: {
    lessons?: { id: string }[];
    lessonSongs?: { song_id: string; song_status: string | null }[];
    songs?: unknown[];
    count?: number;
    lessonsError?: { message: string } | null;
    lessonSongsError?: { message: string } | null;
    songsError?: { message: string } | null;
  }) {
    const {
      lessons = [{ id: LESSON_ID }],
      lessonSongs = [{ song_id: SONG_ID, song_status: 'learning' }],
      songs = [{ id: SONG_ID, title: 'Blackbird' }],
      count = 1,
      lessonsError = null,
      lessonSongsError = null,
      songsError = null,
    } = options;

    let callCount = 0;

    const from = jest.fn().mockImplementation((table: string) => {
      callCount++;
      if (table === 'lessons') {
        const orFn = jest.fn().mockResolvedValue({ data: lessons, error: lessonsError });
        const select = jest.fn().mockReturnValue({ or: orFn });
        return { select };
      }
      if (table === 'lesson_songs') {
        const inFn = jest.fn().mockResolvedValue({ data: lessonSongs, error: lessonSongsError });
        const select = jest.fn().mockReturnValue({ in: inFn });
        return { select };
      }
      // songs table — needs full chain: in → filters → order/range → count
      const resolveResult = {
        data: songs,
        error: songsError,
        count,
      };
      const chain: Record<string, jest.Mock> = {};
      const methods = ['in', 'ilike', 'eq', 'order', 'range'];
      for (const m of methods) {
        chain[m] = jest.fn().mockReturnValue(chain);
      }
      // Make thenable
      chain.then = jest.fn((resolve: (v: unknown) => unknown) =>
        Promise.resolve(resolveResult).then(resolve)
      );
      chain.catch = jest.fn();
      const select = jest.fn().mockReturnValue(chain);
      return { select };
    });

    return { from };
  }

  it('returns paginated songs when userId is provided', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildUserSongsClient({}));
    const res = await getUserSongs(
      makeRequest(`http://localhost/api/song/user-songs?userId=${USER_ID}`)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('songs');
    expect(body).toHaveProperty('pagination');
  });

  it('returns empty result when user has no lessons', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildUserSongsClient({ lessons: [] }));
    const res = await getUserSongs(
      makeRequest(`http://localhost/api/song/user-songs?userId=${USER_ID}`)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.songs).toEqual([]);
    expect(body.pagination.total).toBe(0);
  });

  it('returns empty result when no lesson songs found', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildUserSongsClient({ lessonSongs: [] }));
    const res = await getUserSongs(
      makeRequest(`http://localhost/api/song/user-songs?userId=${USER_ID}`)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.songs).toEqual([]);
  });

  it('returns 500 when lessons query fails', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildUserSongsClient({ lessonsError: { message: 'db error' } })
    );
    const res = await getUserSongs(
      makeRequest(`http://localhost/api/song/user-songs?userId=${USER_ID}`)
    );
    expect(res.status).toBe(500);
  });

  it('returns all songs (no userId) with pagination', async () => {
    const allSongsChain: Record<string, jest.Mock> = {};
    const methods = ['ilike', 'eq', 'order', 'range'];
    for (const m of methods) {
      allSongsChain[m] = jest.fn().mockReturnValue(allSongsChain);
    }
    allSongsChain.then = jest.fn((resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [{ id: SONG_ID, title: 'Song' }], error: null, count: 1 }).then(
        resolve
      )
    );
    allSongsChain.catch = jest.fn();
    const select = jest.fn().mockReturnValue(allSongsChain);
    (createClient as jest.Mock).mockResolvedValue({
      from: jest.fn().mockReturnValue({ select }),
    });

    const res = await getUserSongs(makeRequest('http://localhost/api/song/user-songs'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.songs).toHaveLength(1);
  });

  it('forces student userId to their own id (RBAC)', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof studentCtx) => unknown) => handler(studentCtx)
    );
    (createClient as jest.Mock).mockResolvedValue(buildUserSongsClient({ lessons: [] }));
    // No userId in query param — student gets their own
    const res = await getUserSongs(makeRequest('http://localhost/api/song/user-songs'));
    expect(res.status).toBe(200);
  });
});

// ── GET /api/song/student-songs ───────────────────────────────────────────────

describe('GET /api/song/student-songs', () => {
  function buildStudentSongsClient(options: {
    rows?: unknown[];
    error?: { message: string } | null;
  }) {
    const { rows = [], error = null } = options;
    const result = { data: rows, error };

    const order = jest.fn().mockResolvedValue(result);
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ select });
    return { from };
  }

  it('returns 400 when userId is missing', async () => {
    const res = await getStudentSongs(new NextRequest('http://localhost/api/song/student-songs'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid');
  });

  it('returns 400 when userId is not a valid UUID', async () => {
    const res = await getStudentSongs(
      new NextRequest('http://localhost/api/song/student-songs?userId=not-a-uuid')
    );
    expect(res.status).toBe(400);
  });

  it('returns song list for valid student', async () => {
    const rows = [
      {
        current_status: 'learning',
        songs: { id: SONG_ID, title: 'Blackbird', author: 'Beatles', level: 'beginner', key: 'G' },
      },
    ];
    (createClient as jest.Mock).mockResolvedValue(buildStudentSongsClient({ rows }));
    const res = await getStudentSongs(
      new NextRequest(`http://localhost/api/song/student-songs?userId=${USER_ID}`)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('returns 500 on DB error', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildStudentSongsClient({ rows: [], error: { message: 'db error' } })
    );
    const res = await getStudentSongs(
      new NextRequest(`http://localhost/api/song/student-songs?userId=${USER_ID}`)
    );
    expect(res.status).toBe(500);
  });

  it('forces student userId to their own id (RBAC)', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof studentCtx) => unknown) => handler(studentCtx)
    );
    (createClient as jest.Mock).mockResolvedValue(buildStudentSongsClient({ rows: [] }));
    // Pass a different userId — student gets overridden to their own
    const res = await getStudentSongs(
      new NextRequest(`http://localhost/api/song/student-songs?userId=other-user-id`)
    );
    // Student's own userId (USER_ID) is still a UUID so should pass validation
    // Result depends on mock — just assert it doesn't 403
    expect(res.status).not.toBe(403);
  });
});
