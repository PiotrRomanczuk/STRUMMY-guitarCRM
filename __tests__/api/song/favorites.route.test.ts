// @jest-environment node

import { GET, POST, DELETE } from '@/app/api/song/favorites/route';
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

const adminCtx = {
  user: { id: USER_ID },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isDevelopment: false },
};
const otherUserCtx = {
  user: { id: 'a1b2c3d4-9999-4000-8000-000000000099' },
  roles: { isAdmin: false, isTeacher: false, isStudent: true },
  flags: { isDevelopment: false },
};
const devCtx = {
  user: { id: USER_ID },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isDevelopment: true },
};

function makeGetRequest(params: Record<string, string>): NextRequest {
  const sp = new URLSearchParams(params).toString();
  return new NextRequest(`http://localhost/api/song/favorites?${sp}`);
}

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/song/favorites', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeDeleteRequest(params: Record<string, string>): NextRequest {
  const sp = new URLSearchParams(params).toString();
  return new NextRequest(`http://localhost/api/song/favorites?${sp}`, { method: 'DELETE' });
}

// GET client
function buildGetClient(favorites: unknown[], error: { message: string } | null = null) {
  const result = { data: favorites, error };
  const order = jest.fn().mockResolvedValue(result);
  const eq = jest.fn().mockReturnValue({ order });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  return { from };
}

// POST client: song check + existing favorite check + insert
function buildPostClient(options: {
  songExists?: boolean;
  favExists?: boolean;
  insertError?: { message: string } | null;
}) {
  const { songExists = true, favExists = false, insertError = null } = options;

  const insertSingle = jest.fn().mockResolvedValue({
    data: { id: 'fav-1', user_id: USER_ID, song_id: SONG_ID },
    error: insertError,
  });
  const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
  const insert = jest.fn().mockReturnValue({ select: insertSelect });

  const existingFavSingle = jest
    .fn()
    .mockResolvedValue({ data: favExists ? { id: 'fav-1' } : null });
  const existingFavEq2 = jest.fn().mockReturnValue({ single: existingFavSingle });
  const existingFavEq1 = jest.fn().mockReturnValue({ eq: existingFavEq2 });
  const existingFavSelect = jest.fn().mockReturnValue({ eq: existingFavEq1 });

  const songSingle = jest.fn().mockResolvedValue({ data: songExists ? { id: SONG_ID } : null });
  const songEq = jest.fn().mockReturnValue({ single: songSingle });
  const songSelect = jest.fn().mockReturnValue({ eq: songEq });

  let callCount = 0;
  const from = jest.fn().mockImplementation(() => {
    callCount++;
    if (callCount === 1) return { select: songSelect };
    if (callCount === 2) return { select: existingFavSelect };
    return { insert };
  });
  return { from };
}

// DELETE client
function buildDeleteClient(error: { message: string } | null = null) {
  const eq2 = jest.fn().mockResolvedValue({ error });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const del = jest.fn().mockReturnValue({ eq: eq1 });
  const from = jest.fn().mockReturnValue({ delete: del });
  return { from };
}

beforeEach(() => {
  jest.clearAllMocks();
  (withApiAuth as jest.Mock).mockImplementation(
    async (_req: unknown, handler: (ctx: typeof adminCtx) => unknown) => handler(adminCtx)
  );
});

// ── GET ───────────────────────────────────────────────────────────────────────

describe('GET /api/song/favorites', () => {
  it('returns 400 when userId missing', async () => {
    const res = await GET(makeGetRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('User ID is required');
  });

  it('returns 403 when non-owner non-admin requests another user favorites', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof otherUserCtx) => unknown) => handler(otherUserCtx)
    );
    const res = await GET(makeGetRequest({ userId: USER_ID }));
    expect(res.status).toBe(403);
  });

  it('returns favorites list for valid owner request', async () => {
    const favorites = [{ id: 'fav-1', song: { id: SONG_ID, title: 'Hotel California' } }];
    (createClient as jest.Mock).mockResolvedValue(buildGetClient(favorites));
    const res = await GET(makeGetRequest({ userId: USER_ID }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.favorites).toHaveLength(1);
  });

  it('returns empty list on table-not-found error', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildGetClient([], { message: 'relation "user_favorites" does not exist' })
    );
    const res = await GET(makeGetRequest({ userId: USER_ID }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.favorites).toEqual([]);
  });
});

// ── POST ──────────────────────────────────────────────────────────────────────

describe('POST /api/song/favorites', () => {
  it('returns 403 when isDevelopment flag is set', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof devCtx) => unknown) => handler(devCtx)
    );
    const res = await POST(makePostRequest({ user_id: USER_ID, song_id: SONG_ID }));
    expect(res.status).toBe(403);
  });

  it('creates favorite and returns 200', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildPostClient({}));
    const res = await POST(makePostRequest({ user_id: USER_ID, song_id: SONG_ID }));
    expect(res.status).toBe(200);
  });

  it('returns 500 on DB insert error', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildPostClient({ insertError: { message: 'insert failed' } })
    );
    const res = await POST(makePostRequest({ user_id: USER_ID, song_id: SONG_ID }));
    expect(res.status).toBe(500);
  });
});

// ── DELETE ────────────────────────────────────────────────────────────────────

describe('DELETE /api/song/favorites', () => {
  it('returns 403 when isDevelopment flag is set', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof devCtx) => unknown) => handler(devCtx)
    );
    const res = await DELETE(makeDeleteRequest({ userId: USER_ID, songId: SONG_ID }));
    expect(res.status).toBe(403);
  });

  it('deletes favorite and returns success', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildDeleteClient());
    const res = await DELETE(makeDeleteRequest({ userId: USER_ID, songId: SONG_ID }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 500 on DB delete error', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildDeleteClient({ message: 'delete failed' }));
    const res = await DELETE(makeDeleteRequest({ userId: USER_ID, songId: SONG_ID }));
    expect(res.status).toBe(500);
  });
});
