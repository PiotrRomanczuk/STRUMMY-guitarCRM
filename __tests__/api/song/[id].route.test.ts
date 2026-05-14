// @jest-environment node

import { GET } from '@/app/api/song/[id]/route';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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

function buildClient(overrides: { song?: unknown; songError?: { message: string } | null }) {
  const single = jest.fn().mockResolvedValue({
    data: overrides.song ?? null,
    error: overrides.songError ?? null,
  });
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  return { from };
}

function makeRequest(id: string): [NextRequest, { params: Promise<{ id: string }> }] {
  const req = new NextRequest(`http://localhost/api/song/${id}`);
  const params = Promise.resolve({ id });
  return [req, { params }];
}

beforeEach(() => {
  jest.clearAllMocks();
  (withApiAuth as jest.Mock).mockImplementation(
    async (_req: unknown, handler: (ctx: typeof adminCtx) => unknown) => handler(adminCtx)
  );
});

describe('GET /api/song/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    (withApiAuth as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
    const [req, ctx] = makeRequest(SONG_ID);
    const res = await GET(req, ctx);
    expect(res.status).toBe(401);
  });

  it('returns song for valid id', async () => {
    const song = { id: SONG_ID, title: 'Test Song', author: 'Artist' };
    (createClient as jest.Mock).mockResolvedValue(buildClient({ song }));
    const [req, ctx] = makeRequest(SONG_ID);
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(SONG_ID);
    expect(body.title).toBe('Test Song');
  });

  it('returns 404 for unknown id', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildClient({ song: null, songError: { message: 'not found' } })
    );
    const [req, ctx] = makeRequest(SONG_ID);
    const res = await GET(req, ctx);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Song not found');
  });

  it('returns 404 when song is null (no error)', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildClient({ song: null }));
    const [req, ctx] = makeRequest(SONG_ID);
    const res = await GET(req, ctx);
    expect(res.status).toBe(404);
  });

  it('requests correct columns in select (id, title, author present)', async () => {
    const song = { id: SONG_ID, title: 'Stairway', author: 'Led Zeppelin' };
    const client = buildClient({ song });
    (createClient as jest.Mock).mockResolvedValue(client);
    const [req, ctx] = makeRequest(SONG_ID);
    await GET(req, ctx);
    const selectCall = (client.from('songs').select as jest.Mock).mock.calls[0]?.[0] as string;
    expect(selectCall).toContain('id');
    expect(selectCall).toContain('title');
    expect(selectCall).toContain('author');
  });
});
