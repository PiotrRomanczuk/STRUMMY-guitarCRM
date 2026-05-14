// @jest-environment node

/**
 * Tests for GET /api/song, POST /api/song, PUT /api/song, DELETE /api/song
 * The route delegates to handlers.ts pure functions so we mock those + withApiAuth.
 */

import { GET, POST, PUT, DELETE } from '@/app/api/song/route';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }),
}));

// Mock the handler functions so we don't need a real DB
jest.mock('@/app/api/song/handlers', () => ({
  getSongsHandler: jest.fn(),
  createSongHandler: jest.fn(),
  updateSongHandler: jest.fn(),
  deleteSongHandler: jest.fn(),
}));

import {
  getSongsHandler,
  createSongHandler,
  updateSongHandler,
  deleteSongHandler,
} from '@/app/api/song/handlers';

import { createAdminClient } from '@/lib/supabase/admin';

const SONG_ID = 'a1b2c3d4-1111-4000-8000-000000000010';

const adminCtx = {
  user: { id: 'a1b2c3d4-0000-4000-8000-000000000001' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isDevelopment: false },
};

const devCtx = {
  user: { id: 'a1b2c3d4-0000-4000-8000-000000000001' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isDevelopment: true },
};

function makeRequest(method: string, url: string, body?: Record<string, unknown>): NextRequest {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : {},
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  (withApiAuth as jest.Mock).mockImplementation(
    async (_req: unknown, handler: (ctx: typeof adminCtx) => unknown) => handler(adminCtx)
  );
  // Provide a stub admin client so createAdminClient() doesn't throw
  (createAdminClient as jest.Mock).mockReturnValue({});
});

// ── GET ───────────────────────────────────────────────────────────────────────

describe('GET /api/song', () => {
  it('returns 401 when not authenticated', async () => {
    (withApiAuth as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
    const res = await GET(makeRequest('GET', 'http://localhost/api/song'));
    expect(res.status).toBe(401);
  });

  it('returns paginated songs list', async () => {
    (getSongsHandler as jest.Mock).mockResolvedValue({
      songs: [{ id: SONG_ID, title: 'Blackbird' }],
      count: 1,
    });
    const res = await GET(makeRequest('GET', 'http://localhost/api/song?page=1&limit=50'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.songs).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
    expect(body.pagination.page).toBe(1);
  });

  it('returns handler error as JSON with correct status', async () => {
    (getSongsHandler as jest.Mock).mockResolvedValue({ error: 'Forbidden', status: 403 });
    const res = await GET(makeRequest('GET', 'http://localhost/api/song'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  it('returns 500 on unexpected exception', async () => {
    (getSongsHandler as jest.Mock).mockRejectedValue(new Error('unexpected'));
    const res = await GET(makeRequest('GET', 'http://localhost/api/song'));
    expect(res.status).toBe(500);
  });
});

// ── POST ──────────────────────────────────────────────────────────────────────

describe('POST /api/song', () => {
  it('returns 403 when isDevelopment flag is set', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof devCtx) => unknown) => handler(devCtx)
    );
    const res = await POST(
      makeRequest('POST', 'http://localhost/api/song', { title: 'Test', author: 'Artist' })
    );
    expect(res.status).toBe(403);
  });

  it('creates song and returns 201 body', async () => {
    const created = { id: SONG_ID, title: 'Test', author: 'Artist' };
    (createSongHandler as jest.Mock).mockResolvedValue({
      song: created,
      status: 201,
      error: null,
    });
    const res = await POST(
      makeRequest('POST', 'http://localhost/api/song', { title: 'Test', author: 'Artist' })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe(SONG_ID);
  });

  it('returns handler error response', async () => {
    (createSongHandler as jest.Mock).mockResolvedValue({ error: 'Forbidden', status: 403 });
    const res = await POST(
      makeRequest('POST', 'http://localhost/api/song', { title: 'Test', author: 'Artist' })
    );
    expect(res.status).toBe(403);
  });

  it('returns 500 on unexpected exception', async () => {
    (createSongHandler as jest.Mock).mockRejectedValue(new Error('crash'));
    const res = await POST(
      makeRequest('POST', 'http://localhost/api/song', { title: 'Test', author: 'Artist' })
    );
    expect(res.status).toBe(500);
  });
});

// ── PUT ───────────────────────────────────────────────────────────────────────

describe('PUT /api/song', () => {
  it('returns 400 when no id query param', async () => {
    const res = await PUT(makeRequest('PUT', 'http://localhost/api/song', { title: 'Updated' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Song ID');
  });

  it('returns 403 when isDevelopment flag is set', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof devCtx) => unknown) => handler(devCtx)
    );
    const res = await PUT(
      makeRequest('PUT', `http://localhost/api/song?id=${SONG_ID}`, { title: 'Updated' })
    );
    expect(res.status).toBe(403);
  });

  it('updates song and returns result', async () => {
    const updated = { id: SONG_ID, title: 'Updated' };
    (updateSongHandler as jest.Mock).mockResolvedValue({
      song: updated,
      status: 200,
      error: null,
    });
    const res = await PUT(
      makeRequest('PUT', `http://localhost/api/song?id=${SONG_ID}`, { title: 'Updated' })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(SONG_ID);
  });

  it('returns handler error', async () => {
    (updateSongHandler as jest.Mock).mockResolvedValue({ error: 'Not found', status: 404 });
    const res = await PUT(
      makeRequest('PUT', `http://localhost/api/song?id=${SONG_ID}`, { title: 'Updated' })
    );
    expect(res.status).toBe(404);
  });
});

// ── DELETE ────────────────────────────────────────────────────────────────────

describe('DELETE /api/song', () => {
  it('returns 400 when no id query param', async () => {
    const res = await DELETE(makeRequest('DELETE', 'http://localhost/api/song'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Song ID');
  });

  it('returns 403 when isDevelopment flag is set', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof devCtx) => unknown) => handler(devCtx)
    );
    const res = await DELETE(makeRequest('DELETE', `http://localhost/api/song?id=${SONG_ID}`));
    expect(res.status).toBe(403);
  });

  it('deletes song and returns success', async () => {
    (deleteSongHandler as jest.Mock).mockResolvedValue({
      success: true,
      cascadeInfo: {},
      status: 200,
      error: null,
    });
    const res = await DELETE(makeRequest('DELETE', `http://localhost/api/song?id=${SONG_ID}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns handler error', async () => {
    (deleteSongHandler as jest.Mock).mockResolvedValue({ error: 'Not found', status: 404 });
    const res = await DELETE(makeRequest('DELETE', `http://localhost/api/song?id=${SONG_ID}`));
    expect(res.status).toBe(404);
  });

  it('returns 500 on unexpected exception', async () => {
    (deleteSongHandler as jest.Mock).mockRejectedValue(new Error('crash'));
    const res = await DELETE(makeRequest('DELETE', `http://localhost/api/song?id=${SONG_ID}`));
    expect(res.status).toBe(500);
  });
});
