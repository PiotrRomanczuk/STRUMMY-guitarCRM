// @jest-environment node

import { GET, POST } from '@/app/api/song/[id]/videos/route';
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
  setFilePublicReadable: jest.fn().mockResolvedValue(undefined),
  getVideoMetadata: jest
    .fn()
    .mockResolvedValue({ name: 'test.mp4', mimeType: 'video/mp4', size: '1024' }),
}));
jest.mock('@/schemas/SongVideoSchema', () => ({
  CreateSongVideoInputSchema: { parse: jest.fn((v: unknown) => v) },
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

function makeGetRequest(songId: string): [NextRequest, { params: Promise<{ id: string }> }] {
  return [
    new NextRequest(`http://localhost/api/song/${songId}/videos`),
    { params: Promise.resolve({ id: songId }) },
  ];
}

function makePostRequest(
  songId: string,
  body: Record<string, unknown>
): [NextRequest, { params: Promise<{ id: string }> }] {
  return [
    new NextRequest(`http://localhost/api/song/${songId}/videos`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    { params: Promise.resolve({ id: songId }) },
  ];
}

function buildGetClient(videos: unknown[], error: { message: string } | null = null) {
  const result = { data: videos, error };
  const order2 = jest.fn().mockResolvedValue(result);
  const order1 = jest.fn().mockReturnValue({ order: order2 });
  const eq = jest.fn().mockReturnValue({ order: order1 });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  return { from };
}

function buildPostClient(insertedVideo: unknown, insertError: { message: string } | null = null) {
  const insertSingle = jest.fn().mockResolvedValue({ data: insertedVideo, error: insertError });
  const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
  const insert = jest.fn().mockReturnValue({ select: insertSelect });

  // For the display_order query (single returns null to skip existing)
  const lastSingle = jest.fn().mockResolvedValue({ data: null });
  const lastLimit = jest.fn().mockReturnValue({ single: lastSingle });
  const lastOrder = jest.fn().mockReturnValue({ limit: lastLimit });
  const lastEq = jest.fn().mockReturnValue({ order: lastOrder });
  const lastSelect = jest.fn().mockReturnValue({ eq: lastEq });

  const from = jest.fn().mockImplementation((table: string) => {
    if (table === 'song_videos') {
      return {
        select: lastSelect,
        insert,
      };
    }
    return { select: lastSelect };
  });
  return { from };
}

beforeEach(() => {
  jest.clearAllMocks();
  (withApiAuth as jest.Mock).mockImplementation(
    async (_req: unknown, handler: (ctx: typeof adminCtx) => unknown) => handler(adminCtx)
  );
});

describe('GET /api/song/[id]/videos', () => {
  it('returns videos array ordered by display_order', async () => {
    const videos = [
      { id: VIDEO_ID, title: 'Lesson 1', display_order: 0 },
      { id: 'vid-2', title: 'Lesson 2', display_order: 1 },
    ];
    (createClient as jest.Mock).mockResolvedValue(buildGetClient(videos));
    const [req, ctx] = makeGetRequest(SONG_ID);
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.videos).toHaveLength(2);
  });

  it('returns 500 on DB error', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildGetClient([], { message: 'connection refused' })
    );
    const [req, ctx] = makeGetRequest(SONG_ID);
    const res = await GET(req, ctx);
    expect(res.status).toBe(500);
  });

  it('returns empty array when no videos', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildGetClient([]));
    const [req, ctx] = makeGetRequest(SONG_ID);
    const res = await GET(req, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.videos).toEqual([]);
  });
});

describe('POST /api/song/[id]/videos', () => {
  it('returns 403 for student role', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof studentCtx) => unknown) => handler(studentCtx)
    );
    const [req, ctx] = makePostRequest(SONG_ID, { google_drive_file_id: 'gd-123' });
    const res = await POST(req, ctx);
    expect(res.status).toBe(403);
  });

  it('creates video record for valid payload', async () => {
    const newVideo = { id: VIDEO_ID, song_id: SONG_ID, title: 'test.mp4' };
    (createClient as jest.Mock).mockResolvedValue(buildPostClient(newVideo));
    const body = {
      google_drive_file_id: 'gd-123',
      filename: 'test.mp4',
      mime_type: 'video/mp4',
      video_type: 'lesson',
    };
    const [req, ctx] = makePostRequest(SONG_ID, body);
    const res = await POST(req, ctx);
    expect(res.status).toBe(201);
    const resBody = await res.json();
    expect(resBody.video).toEqual(newVideo);
  });

  it('returns 400 when ZodError is thrown by schema parse', async () => {
    const { CreateSongVideoInputSchema } = jest.requireMock('@/schemas/SongVideoSchema') as {
      CreateSongVideoInputSchema: { parse: jest.Mock };
    };
    const zodErr = Object.assign(new Error('filename: Required'), { name: 'ZodError' });
    CreateSongVideoInputSchema.parse.mockImplementationOnce(() => {
      throw zodErr;
    });
    (createClient as jest.Mock).mockResolvedValue(buildPostClient(null));
    const [req, ctx] = makePostRequest(SONG_ID, {});
    const res = await POST(req, ctx);
    expect(res.status).toBe(400);
  });

  it('returns 500 on DB insert error', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildPostClient(null, { message: 'insert failed' })
    );
    const body = {
      google_drive_file_id: 'gd-123',
      filename: 'test.mp4',
      mime_type: 'video/mp4',
      video_type: 'lesson',
    };
    const [req, ctx] = makePostRequest(SONG_ID, body);
    const res = await POST(req, ctx);
    expect(res.status).toBe(500);
  });
});
