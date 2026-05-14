// @jest-environment node

import { POST } from '@/app/api/song/create/route';
import { PUT } from '@/app/api/song/update/route';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }),
}));

const SONG_ID = 'a1b2c3d4-1111-4000-8000-000000000010';

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
const devCtx = {
  user: { id: 'a1b2c3d4-0000-4000-8000-000000000001' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isDevelopment: true },
};

// Minimal valid song body that passes SongInputSchema
const validSongBody = { title: 'New Song', author: 'Artist', level: 'beginner', key: 'G' };

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/song/create', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makePutRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/song/update', {
    method: 'PUT',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function buildCreateClient(song: unknown, error: { message: string; code?: string } | null = null) {
  const single = jest.fn().mockResolvedValue({ data: song, error });
  const select = jest.fn().mockReturnValue({ single });
  const insert = jest.fn().mockReturnValue({ select });
  const from = jest.fn().mockReturnValue({ insert });
  return { from };
}

function buildUpdateClient(options: {
  existingSong?: { id: string } | null;
  updatedSong?: unknown;
  updateError?: { message: string } | null;
}) {
  const { existingSong = { id: SONG_ID }, updatedSong = {}, updateError = null } = options;

  const updateSingle = jest.fn().mockResolvedValue({ data: updatedSong, error: updateError });
  const updateSelect = jest.fn().mockReturnValue({ single: updateSingle });
  const updateEq = jest.fn().mockReturnValue({ select: updateSelect });
  const update = jest.fn().mockReturnValue({ eq: updateEq });

  const existingSingle = jest.fn().mockResolvedValue({ data: existingSong });
  const existingEq = jest.fn().mockReturnValue({ single: existingSingle });
  const existingSelect = jest.fn().mockReturnValue({ eq: existingEq });

  let callCount = 0;
  const from = jest.fn().mockImplementation(() => {
    callCount++;
    if (callCount === 1) return { select: existingSelect };
    return { update };
  });
  return { from };
}

beforeEach(() => {
  jest.clearAllMocks();
  (withApiAuth as jest.Mock).mockImplementation(
    async (_req: unknown, handler: (ctx: typeof adminCtx) => unknown) => handler(adminCtx)
  );
});

// ── create POST ───────────────────────────────────────────────────────────────

describe('POST /api/song/create', () => {
  it('returns 403 when isDevelopment flag is set', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof devCtx) => unknown) => handler(devCtx)
    );
    const res = await POST(makePostRequest(validSongBody));
    expect(res.status).toBe(403);
  });

  it('returns 403 for student role', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof studentCtx) => unknown) => handler(studentCtx)
    );
    const res = await POST(makePostRequest(validSongBody));
    expect(res.status).toBe(403);
  });

  it('returns 400 for invalid Zod input', async () => {
    // Empty body fails SongInputSchema (title is required)
    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid song data');
  });

  it('inserts valid song and returns 200', async () => {
    const created = { id: SONG_ID, ...validSongBody };
    (createClient as jest.Mock).mockResolvedValue(buildCreateClient(created));
    const res = await POST(makePostRequest(validSongBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(SONG_ID);
  });

  it('returns 500 on DB error', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildCreateClient(null, { message: 'insert failed' })
    );
    const res = await POST(makePostRequest(validSongBody));
    expect(res.status).toBe(500);
  });
});

// ── update PUT ────────────────────────────────────────────────────────────────

describe('PUT /api/song/update', () => {
  it('returns 403 when isDevelopment flag is set', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof devCtx) => unknown) => handler(devCtx)
    );
    const res = await PUT(makePutRequest({ id: SONG_ID, title: 'Updated' }));
    expect(res.status).toBe(403);
  });

  it('returns 403 for student role', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof studentCtx) => unknown) => handler(studentCtx)
    );
    const res = await PUT(makePutRequest({ id: SONG_ID, title: 'Updated' }));
    expect(res.status).toBe(403);
  });

  it('returns 404 when song not found', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildUpdateClient({ existingSong: null }));
    const res = await PUT(makePutRequest({ id: SONG_ID, title: 'Updated' }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain('No song found');
  });

  it('returns 200 on valid update', async () => {
    const updated = { id: SONG_ID, title: 'Updated' };
    (createClient as jest.Mock).mockResolvedValue(buildUpdateClient({ updatedSong: updated }));
    const res = await PUT(makePutRequest({ id: SONG_ID, title: 'Updated' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.song).toEqual(updated);
  });

  it('returns 400 on Zod validation error (missing id)', async () => {
    // SongUpdateSchema requires an id field
    const res = await PUT(makePutRequest({ title: 'No ID here' }));
    expect(res.status).toBe(400);
  });
});
