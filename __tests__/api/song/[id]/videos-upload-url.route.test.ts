// @jest-environment node

import { POST } from '@/app/api/song/[id]/videos/upload-url/route';
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
  createResumableUploadUrl: jest
    .fn()
    .mockResolvedValue({ uploadUrl: 'https://upload.url', folderId: 'folder-123' }),
}));
jest.mock('@/schemas/SongVideoSchema', () => ({
  UploadUrlRequestSchema: { parse: jest.fn((v: unknown) => v) },
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

function makeRequest(
  songId: string,
  body: Record<string, unknown>
): [NextRequest, { params: Promise<{ id: string }> }] {
  return [
    new NextRequest(`http://localhost/api/song/${songId}/videos/upload-url`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }),
    { params: Promise.resolve({ id: songId }) },
  ];
}

function buildClient(song: { id: string } | null) {
  const single = jest.fn().mockResolvedValue({ data: song });
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });
  return { from };
}

beforeEach(() => {
  jest.clearAllMocks();
  (withApiAuth as jest.Mock).mockImplementation(
    async (_req: unknown, handler: (ctx: typeof adminCtx) => unknown) => handler(adminCtx)
  );
});

describe('POST /api/song/[id]/videos/upload-url', () => {
  it('returns 403 for student role', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof studentCtx) => unknown) => handler(studentCtx)
    );
    const [req, ctx] = makeRequest(SONG_ID, { filename: 'v.mp4', mime_type: 'video/mp4' });
    const res = await POST(req, ctx);
    expect(res.status).toBe(403);
  });

  it('returns 404 when song not found', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildClient(null));
    const [req, ctx] = makeRequest(SONG_ID, { filename: 'v.mp4', mime_type: 'video/mp4' });
    const res = await POST(req, ctx);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Song not found');
  });

  it('returns uploadUrl and folderId on valid request', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildClient({ id: SONG_ID }));
    const [req, ctx] = makeRequest(SONG_ID, {
      filename: 'lesson.mp4',
      mime_type: 'video/mp4',
      file_size_bytes: 2048,
    });
    const res = await POST(req, ctx);
    expect(res.status).toBe(200);
    const resBody = await res.json();
    expect(resBody.uploadUrl).toBe('https://upload.url');
    expect(resBody.folderId).toBe('folder-123');
  });

  it('returns 500 when google-drive createResumableUploadUrl throws', async () => {
    const { createResumableUploadUrl } = jest.requireMock('@/lib/services/google-drive') as {
      createResumableUploadUrl: jest.Mock;
    };
    createResumableUploadUrl.mockRejectedValueOnce(new Error('Drive API error'));
    (createClient as jest.Mock).mockResolvedValue(buildClient({ id: SONG_ID }));
    const [req, ctx] = makeRequest(SONG_ID, { filename: 'v.mp4', mime_type: 'video/mp4' });
    const res = await POST(req, ctx);
    expect(res.status).toBe(500);
  });

  it('returns 400 when ZodError thrown by schema parse', async () => {
    const { UploadUrlRequestSchema } = jest.requireMock('@/schemas/SongVideoSchema') as {
      UploadUrlRequestSchema: { parse: jest.Mock };
    };
    const zodErr = Object.assign(new Error('filename: Required'), { name: 'ZodError' });
    UploadUrlRequestSchema.parse.mockImplementationOnce(() => {
      throw zodErr;
    });
    (createClient as jest.Mock).mockResolvedValue(buildClient({ id: SONG_ID }));
    const [req, ctx] = makeRequest(SONG_ID, {});
    const res = await POST(req, ctx);
    expect(res.status).toBe(400);
  });
});
