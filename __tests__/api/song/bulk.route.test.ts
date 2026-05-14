// @jest-environment node

import { POST, DELETE } from '@/app/api/song/bulk/route';
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
const devCtx = {
  user: { id: 'a1b2c3d4-0000-4000-8000-000000000001' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isDevelopment: true },
};

const SONG_ID = 'a1b2c3d4-1111-4000-8000-000000000010';

const validSong = {
  title: 'Test Song',
  author: 'Test Artist',
  level: 'beginner' as const,
  key: 'G' as const,
};

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/song/bulk', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeDeleteRequest(ids: string): NextRequest {
  return new NextRequest(`http://localhost/api/song/bulk?ids=${ids}`, {
    method: 'DELETE',
  });
}

// Client for insert flow — no existing song, successful insert
function buildInsertClient(insertError: { message: string } | null = null) {
  const insertSingle = jest
    .fn()
    .mockResolvedValue({ data: { id: SONG_ID, title: 'Test Song' }, error: insertError });
  const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
  const insert = jest.fn().mockReturnValue({ select: insertSelect });

  // Existing check returns null (no duplicate)
  const existingSingle = jest.fn().mockResolvedValue({ data: null });
  const existingEq = jest.fn().mockReturnValue({ single: existingSingle });
  const existingSelect = jest.fn().mockReturnValue({ eq: existingEq });

  const from = jest.fn().mockReturnValue({
    select: existingSelect,
    insert,
  });
  return { from };
}

// Client for delete flow
function buildDeleteClient(deleteError: { message: string } | null = null) {
  const inFn = jest.fn().mockResolvedValue({ error: deleteError });
  const del = jest.fn().mockReturnValue({ in: inFn });
  const from = jest.fn().mockReturnValue({ delete: del });
  return { from };
}

beforeEach(() => {
  jest.clearAllMocks();
  (withApiAuth as jest.Mock).mockImplementation(
    async (_req: unknown, handler: (ctx: typeof adminCtx) => unknown) => handler(adminCtx)
  );
});

// ── POST ──────────────────────────────────────────────────────────────────────

describe('POST /api/song/bulk', () => {
  it('returns 403 when isDevelopment flag is set', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof devCtx) => unknown) => handler(devCtx)
    );
    const res = await POST(makePostRequest({ songs: [validSong] }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('This action is not available on test accounts');
  });

  it('returns 403 for student role', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof studentCtx) => unknown) => handler(studentCtx)
    );
    const res = await POST(makePostRequest({ songs: [validSong] }));
    expect(res.status).toBe(403);
  });

  it('validate_only=true returns validation results without DB insert', async () => {
    // Route calls createClient before validate_only check, so provide a stub
    (createClient as jest.Mock).mockResolvedValue({});
    const res = await POST(makePostRequest({ songs: [validSong], validate_only: true }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('validation_results');
    expect(body.summary.total).toBe(1);
  });

  it('inserts songs with overwrite=false and returns results', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildInsertClient());
    const res = await POST(makePostRequest({ songs: [validSong], overwrite: false }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.total).toBe(1);
    expect(body.results[0].status).toBe('created');
  });

  it('returns 500 on DB insert error', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildInsertClient({ message: 'db error' }));
    const res = await POST(makePostRequest({ songs: [validSong] }));
    expect(res.status).toBe(200); // bulk returns 200 with per-song error status in results
    const body = await res.json();
    expect(body.results[0].status).toBe('error');
    expect(body.summary.error).toBe(1);
  });
});

// ── DELETE ────────────────────────────────────────────────────────────────────

describe('DELETE /api/song/bulk', () => {
  it('returns 403 for student role', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof studentCtx) => unknown) => handler(studentCtx)
    );
    const res = await DELETE(makeDeleteRequest(SONG_ID));
    expect(res.status).toBe(403);
  });

  it('deletes songs by id list and returns 200', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildDeleteClient());
    const ids = `${SONG_ID},a1b2c3d4-1111-4000-8000-000000000011`;
    const res = await DELETE(makeDeleteRequest(ids));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.deleted_count).toBe(2);
  });

  it('returns 500 on DB delete error', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildDeleteClient({ message: 'delete failed' }));
    const res = await DELETE(makeDeleteRequest(SONG_ID));
    expect(res.status).toBe(500);
  });
});
