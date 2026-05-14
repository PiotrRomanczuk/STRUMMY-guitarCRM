// @jest-environment node

import { PATCH, DELETE } from '@/app/api/song/[id]/videos/[videoId]/route';
import { GET as getStream } from '@/app/api/song/[id]/videos/[videoId]/stream/route';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }),
}));
jest.mock('@/lib/services/google-drive', () => ({
  deleteVideoFromDrive: jest.fn().mockResolvedValue(undefined),
  getVideoStreamUrl: jest.fn().mockResolvedValue('https://stream.example.com/video'),
}));
jest.mock('@/schemas/SongVideoSchema', () => ({
  UpdateSongVideoInputSchema: { parse: jest.fn((v: unknown) => v) },
}));

const SONG_ID = 'a1b2c3d4-1111-4000-8000-000000000010';
const VIDEO_ID = 'a1b2c3d4-1111-4000-8000-000000000040';

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

type VideoRouteCtx = { params: Promise<{ id: string; videoId: string }> };

function makeCtx(songId = SONG_ID, videoId = VIDEO_ID): VideoRouteCtx {
  return { params: Promise.resolve({ id: songId, videoId }) };
}

function makePatchRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost/api/song/${SONG_ID}/videos/${VIDEO_ID}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeDeleteRequest(): NextRequest {
  return new NextRequest(`http://localhost/api/song/${SONG_ID}/videos/${VIDEO_ID}`, {
    method: 'DELETE',
  });
}

function makeStreamRequest(): NextRequest {
  return new NextRequest(`http://localhost/api/song/${SONG_ID}/videos/${VIDEO_ID}/stream`);
}

// PATCH client: update returns video or null
function buildPatchClient(video: unknown, updateError: { message: string } | null = null) {
  const single = jest.fn().mockResolvedValue({ data: video, error: updateError });
  const select = jest.fn().mockReturnValue({ single });
  const eq2 = jest.fn().mockReturnValue({ select });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const update = jest.fn().mockReturnValue({ eq: eq1 });
  const from = jest.fn().mockReturnValue({ update });
  return { from };
}

// DELETE client: first query to fetch video, then delete
function buildDeleteClient(
  fetchedVideo: { google_drive_file_id: string } | null,
  deleteError: { message: string } | null = null
) {
  let callCount = 0;
  const from = jest.fn().mockImplementation(() => {
    callCount++;
    if (callCount === 1) {
      // fetch video
      const single = jest.fn().mockResolvedValue({ data: fetchedVideo });
      const eq2 = jest.fn().mockReturnValue({ single });
      const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
      const select = jest.fn().mockReturnValue({ eq: eq1 });
      return { select };
    }
    // delete
    const eq2 = jest.fn().mockResolvedValue({ error: deleteError });
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
    const del = jest.fn().mockReturnValue({ eq: eq1 });
    return { delete: del };
  });
  return { from };
}

// Stream client
function buildStreamClient(video: { google_drive_file_id: string } | null) {
  const single = jest.fn().mockResolvedValue({ data: video });
  const eq2 = jest.fn().mockReturnValue({ single });
  const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
  const select = jest.fn().mockReturnValue({ eq: eq1 });
  const from = jest.fn().mockReturnValue({ select });
  return { from };
}

beforeEach(() => {
  jest.clearAllMocks();
  (withApiAuth as jest.Mock).mockImplementation(
    async (_req: unknown, handler: (ctx: typeof adminCtx) => unknown) => handler(adminCtx)
  );
});

// ── PATCH ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/song/[id]/videos/[videoId]', () => {
  it('returns 403 for student role', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof studentCtx) => unknown) => handler(studentCtx)
    );
    const res = await PATCH(makePatchRequest({ title: 'new' }), makeCtx());
    expect(res.status).toBe(403);
  });

  it('returns updated video on valid update', async () => {
    const updated = { id: VIDEO_ID, title: 'Updated Title', song_id: SONG_ID };
    (createClient as jest.Mock).mockResolvedValue(buildPatchClient(updated));
    const res = await PATCH(makePatchRequest({ title: 'Updated Title' }), makeCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.video).toEqual(updated);
  });

  it('returns 404 when video not found (null data, no error)', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildPatchClient(null));
    const res = await PATCH(makePatchRequest({ title: 'x' }), makeCtx());
    expect(res.status).toBe(404);
  });

  it('returns 500 on DB error', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildPatchClient(null, { message: 'update failed' })
    );
    const res = await PATCH(makePatchRequest({ title: 'x' }), makeCtx());
    expect(res.status).toBe(500);
  });

  it('returns 400 on ZodError from schema parse', async () => {
    const { UpdateSongVideoInputSchema } = jest.requireMock('@/schemas/SongVideoSchema') as {
      UpdateSongVideoInputSchema: { parse: jest.Mock };
    };
    const zodErr = Object.assign(new Error('title: Expected string'), { name: 'ZodError' });
    UpdateSongVideoInputSchema.parse.mockImplementationOnce(() => {
      throw zodErr;
    });
    (createClient as jest.Mock).mockResolvedValue(buildPatchClient(null));
    const res = await PATCH(makePatchRequest({}), makeCtx());
    expect(res.status).toBe(400);
  });
});

// ── DELETE ────────────────────────────────────────────────────────────────────

describe('DELETE /api/song/[id]/videos/[videoId]', () => {
  it('returns 403 for student role', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof studentCtx) => unknown) => handler(studentCtx)
    );
    const res = await DELETE(makeDeleteRequest(), makeCtx());
    expect(res.status).toBe(403);
  });

  it('returns 200 success on valid delete', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildDeleteClient({ google_drive_file_id: 'gd-abc' })
    );
    const res = await DELETE(makeDeleteRequest(), makeCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('returns 404 when video not found', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildDeleteClient(null));
    const res = await DELETE(makeDeleteRequest(), makeCtx());
    expect(res.status).toBe(404);
  });
});

// ── GET stream ────────────────────────────────────────────────────────────────

describe('GET /api/song/[id]/videos/[videoId]/stream', () => {
  it('returns stream URL for valid video', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildStreamClient({ google_drive_file_id: 'gd-xyz' })
    );
    const res = await getStream(makeStreamRequest(), makeCtx());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe('https://stream.example.com/video');
  });

  it('returns 404 when video not found', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildStreamClient(null));
    const res = await getStream(makeStreamRequest(), makeCtx());
    expect(res.status).toBe(404);
  });

  it('returns 500 when google-drive throws', async () => {
    const { getVideoStreamUrl } = jest.requireMock('@/lib/services/google-drive') as {
      getVideoStreamUrl: jest.Mock;
    };
    getVideoStreamUrl.mockRejectedValueOnce(new Error('Drive error'));
    (createClient as jest.Mock).mockResolvedValue(
      buildStreamClient({ google_drive_file_id: 'gd-xyz' })
    );
    const res = await getStream(makeStreamRequest(), makeCtx());
    expect(res.status).toBe(500);
  });
});
