// @jest-environment node

/**
 * Tests for POST /api/song/from-spotify
 * Covers auth, input validation, Spotify API failures, DB errors, and happy path.
 * Detailed unit tests live at app/api/song/from-spotify/__tests__/route.unit.test.ts.
 * These tests exercise the same route from the __tests__/api tree for consistency.
 */

import { POST } from '@/app/api/song/from-spotify/route';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTrack, getAudioFeatures } from '@/lib/spotify';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn() }));
jest.mock('@/lib/spotify', () => ({
  getTrack: jest.fn(),
  getAudioFeatures: jest.fn(),
}));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }),
}));

const SPOTIFY_URL = 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp';
const TRACK_ID = '3n3Ppam7vgaVa1iaRUc9Lp';

const MOCK_TRACK = {
  id: TRACK_ID,
  name: 'Wonderwall',
  artists: [{ name: 'Oasis' }],
  album: {
    name: "(What's the Story) Morning Glory?",
    images: [{ url: 'https://i.scdn.co/image/cover.jpg' }],
    release_date: '1995-10-02',
  },
  external_urls: { spotify: SPOTIFY_URL },
  duration_ms: 258000,
};

const MOCK_FEATURES = {
  key: 6,
  mode: 1,
  tempo: 87.5,
  time_signature: 4,
  duration_ms: 258000,
};

const adminCtx = {
  user: { id: 'a1b2c3d4-0000-4000-8000-000000000001' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isDevelopment: false },
};

const teacherCtx = {
  user: { id: 'a1b2c3d4-0000-4000-8000-000000000002' },
  roles: { isAdmin: false, isTeacher: true, isStudent: false },
  flags: { isDevelopment: false },
};

const studentCtx = {
  user: { id: 'a1b2c3d4-0000-4000-8000-000000000003' },
  roles: { isAdmin: false, isTeacher: false, isStudent: true },
  flags: { isDevelopment: false },
};

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/song/from-spotify', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function buildInsertClient(
  options: {
    song?: unknown;
    error?: { code?: string; message: string } | null;
  } = {}
) {
  const { song = { id: 'new-id', title: 'Wonderwall' }, error = null } = options;
  const single = jest.fn().mockResolvedValue({ data: song, error });
  const select = jest.fn().mockReturnValue({ single });
  const insert = jest.fn().mockReturnValue({ select });
  const from = jest.fn().mockReturnValue({ insert });
  return { from };
}

beforeEach(() => {
  jest.clearAllMocks();
  (withApiAuth as jest.Mock).mockImplementation(
    async (_req: unknown, handler: (ctx: typeof adminCtx) => unknown) => handler(adminCtx)
  );
});

describe('POST /api/song/from-spotify', () => {
  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      (withApiAuth as jest.Mock).mockResolvedValueOnce(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
      const res = await POST(makeRequest({ spotify_url: SPOTIFY_URL }));
      expect(res.status).toBe(401);
    });

    it('returns 403 for student role', async () => {
      (withApiAuth as jest.Mock).mockImplementation(
        async (_req: unknown, handler: (ctx: typeof studentCtx) => unknown) => handler(studentCtx)
      );
      const res = await POST(makeRequest({ spotify_url: SPOTIFY_URL }));
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain('Only teachers and admins');
    });

    it('allows teacher role', async () => {
      (withApiAuth as jest.Mock).mockImplementation(
        async (_req: unknown, handler: (ctx: typeof teacherCtx) => unknown) => handler(teacherCtx)
      );
      (createAdminClient as jest.Mock).mockReturnValue(buildInsertClient());
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockResolvedValue(MOCK_FEATURES);
      const res = await POST(makeRequest({ spotify_url: SPOTIFY_URL }));
      expect(res.status).toBe(201);
    });
  });

  describe('input validation', () => {
    it('returns 400 for missing spotify_url', async () => {
      const res = await POST(makeRequest({}));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Validation failed');
    });

    it('returns 400 for empty spotify_url', async () => {
      const res = await POST(makeRequest({ spotify_url: '' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for non-Spotify URL without /track/ path', async () => {
      const res = await POST(makeRequest({ spotify_url: 'https://example.com/song/abc' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid Spotify URL or track ID');
    });

    it('returns 400 for invalid JSON body', async () => {
      const req = new NextRequest('http://localhost/api/song/from-spotify', {
        method: 'POST',
        body: 'not-json',
        headers: { 'Content-Type': 'application/json' },
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid JSON body');
    });
  });

  describe('Spotify API failures', () => {
    it('returns 502 when track fetch fails', async () => {
      (getTrack as jest.Mock).mockRejectedValue(new Error('Spotify down'));
      const res = await POST(makeRequest({ spotify_url: SPOTIFY_URL }));
      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toContain('Failed to fetch track');
    });

    it('succeeds even when audio features fetch fails (graceful degradation)', async () => {
      (createAdminClient as jest.Mock).mockReturnValue(buildInsertClient());
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockRejectedValue(new Error('features unavailable'));
      const res = await POST(makeRequest({ spotify_url: SPOTIFY_URL }));
      expect(res.status).toBe(201);
    });
  });

  describe('database errors', () => {
    it('returns 409 on duplicate song (unique constraint)', async () => {
      (createAdminClient as jest.Mock).mockReturnValue(
        buildInsertClient({ error: { code: '23505', message: 'duplicate key' } })
      );
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockResolvedValue(MOCK_FEATURES);
      const res = await POST(makeRequest({ spotify_url: SPOTIFY_URL }));
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toContain('already exists');
    });

    it('returns 500 on generic DB error', async () => {
      (createAdminClient as jest.Mock).mockReturnValue(
        buildInsertClient({ error: { code: '42000', message: 'something broke' } })
      );
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockResolvedValue(MOCK_FEATURES);
      const res = await POST(makeRequest({ spotify_url: SPOTIFY_URL }));
      expect(res.status).toBe(500);
    });
  });

  describe('happy path', () => {
    it('creates song from Spotify URL and returns 201 with song + source metadata', async () => {
      const created = { id: 'new-id', title: 'Wonderwall', author: 'Oasis' };
      (createAdminClient as jest.Mock).mockReturnValue(buildInsertClient({ song: created }));
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockResolvedValue(MOCK_FEATURES);
      const res = await POST(makeRequest({ spotify_url: SPOTIFY_URL }));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.song.title).toBe('Wonderwall');
      expect(body.source).toBe('spotify');
      expect(body.track_id).toBe(TRACK_ID);
    });

    it('accepts spotify: URI format', async () => {
      (createAdminClient as jest.Mock).mockReturnValue(buildInsertClient());
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockResolvedValue(MOCK_FEATURES);
      const res = await POST(makeRequest({ spotify_url: `spotify:track:${TRACK_ID}` }));
      expect(res.status).toBe(201);
      expect(getTrack).toHaveBeenCalledWith(TRACK_ID);
    });
  });
});
