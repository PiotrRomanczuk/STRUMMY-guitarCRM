/**
 * @jest-environment node
 */

import { POST } from '../route';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTrack, getAudioFeatures } from '@/lib/spotify';

jest.mock('@/lib/auth/api-auth');
jest.mock('@/lib/supabase/admin');
jest.mock('@/lib/spotify');
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEACHER_ID = '45085573-07bc-475b-b8f2-baeae18ffb4e';
const ADMIN_ID = '8f842809-facd-4de4-9b8d-4de8444b145a';
const STUDENT_ID = '69590a6f-5873-428b-8e37-9c1306f26757';

const SPOTIFY_URL = 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp';

const MOCK_TRACK = {
  id: '3n3Ppam7vgaVa1iaRUc9Lp',
  name: 'Wonderwall',
  artists: [{ name: 'Oasis' }],
  album: {
    name: "(What's the Story) Morning Glory?",
    images: [{ url: 'https://i.scdn.co/image/cover.jpg' }],
    release_date: '1995-10-02',
  },
  external_urls: { spotify: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp' },
  duration_ms: 258000,
};

const MOCK_FEATURES = {
  key: 6,
  mode: 1,
  tempo: 87.5,
  time_signature: 4,
  duration_ms: 258000,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>, apiKey?: string): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return new Request('http://localhost:3000/api/song/from-spotify', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function mockAuth(userId: string) {
  (authenticateRequest as jest.Mock).mockResolvedValue({
    user: { id: userId, email: 'test@test.com' },
    status: 200,
  });
}

function mockUnauthenticated() {
  (authenticateRequest as jest.Mock).mockResolvedValue({
    user: null,
    error: 'Invalid API key',
    status: 401,
  });
}

/**
 * Mock the admin client with profile lookup and optional song insert.
 */
function mockAdminClient(
  profile: {
    is_admin: boolean;
    is_teacher: boolean;
    is_development?: boolean;
  } | null,
  insertResult?: { data?: unknown; error?: { code?: string; message: string } | null }
) {
  let callCount = 0;
  const mock = {
    from: jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Profile lookup
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: profile,
                error: profile ? null : { code: 'PGRST116', message: 'not found' },
              }),
            }),
          }),
        };
      }
      // Song insert
      return {
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue(
              insertResult ?? {
                data: { id: 'new-song-id', title: 'Wonderwall' },
                error: null,
              }
            ),
          }),
        }),
      };
    }),
  };
  (createAdminClient as jest.Mock).mockReturnValue(mock);
  return mock;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/song/from-spotify', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- Auth ----

  describe('authentication', () => {
    it('returns 401 when no auth header and no cookie session', async () => {
      (authenticateRequest as jest.Mock).mockResolvedValue({
        user: null,
        error: 'Unauthorized - no valid session or API key',
        status: 401,
      });

      const req = makeRequest({ spotify_url: SPOTIFY_URL });
      const res = await POST(req);

      expect(res.status).toBe(401);
    });

    it('returns 401 for invalid API key', async () => {
      mockUnauthenticated();

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_invalid_key');
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toContain('Invalid API key');
    });

    it('returns 401 for malformed Authorization header', async () => {
      (authenticateRequest as jest.Mock).mockResolvedValue({
        user: null,
        error: 'Invalid Authorization header format. Use: Bearer <token>',
        status: 401,
      });

      const req = new Request('http://localhost:3000/api/song/from-spotify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'NotBearer gcrm_key',
        },
        body: JSON.stringify({ spotify_url: SPOTIFY_URL }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('returns 403 when authenticated user is a student (not teacher/admin)', async () => {
      mockAuth(STUDENT_ID);
      mockAdminClient({ is_admin: false, is_teacher: false });

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain('Only teachers and admins');
    });

    it('returns 404 when user profile does not exist', async () => {
      mockAuth(TEACHER_ID);
      mockAdminClient(null);

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(404);
    });

    it('allows admin users', async () => {
      mockAuth(ADMIN_ID);
      mockAdminClient({ is_admin: true, is_teacher: false });
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockResolvedValue(MOCK_FEATURES);

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_admin_key');
      const res = await POST(req);

      expect(res.status).toBe(201);
    });

    it('allows teacher users', async () => {
      mockAuth(TEACHER_ID);
      mockAdminClient({ is_admin: false, is_teacher: true });
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockResolvedValue(MOCK_FEATURES);

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_teacher_key');
      const res = await POST(req);

      expect(res.status).toBe(201);
    });
  });

  // ---- Input validation ----

  describe('input validation', () => {
    it('returns 400 for missing spotify_url', async () => {
      mockAuth(TEACHER_ID);
      mockAdminClient({ is_admin: false, is_teacher: true });

      const req = makeRequest({}, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Validation failed');
    });

    it('returns 400 for empty spotify_url', async () => {
      mockAuth(TEACHER_ID);
      mockAdminClient({ is_admin: false, is_teacher: true });

      const req = makeRequest({ spotify_url: '' }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid Spotify URL', async () => {
      mockAuth(TEACHER_ID);
      mockAdminClient({ is_admin: false, is_teacher: true });

      const req = makeRequest({ spotify_url: 'https://example.com/not-spotify' }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid Spotify URL or track ID');
    });

    it('returns 400 for invalid JSON body', async () => {
      mockAuth(TEACHER_ID);
      mockAdminClient({ is_admin: false, is_teacher: true });

      const req = new Request('http://localhost:3000/api/song/from-spotify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer gcrm_valid_key',
        },
        body: 'not json',
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid JSON body');
    });
  });

  // ---- Spotify API errors ----

  describe('Spotify API failures', () => {
    it('returns 502 when Spotify track fetch fails', async () => {
      mockAuth(TEACHER_ID);
      mockAdminClient({ is_admin: false, is_teacher: true });
      (getTrack as jest.Mock).mockRejectedValue(new Error('Spotify API error'));

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toBe('Failed to fetch track from Spotify');
    });

    it('succeeds without audio features (graceful degradation)', async () => {
      mockAuth(TEACHER_ID);
      mockAdminClient({ is_admin: false, is_teacher: true });
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockRejectedValue(new Error('Features unavailable'));

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.song.title).toBe('Wonderwall');
      expect(body.source).toBe('spotify');
    });
  });

  // ---- DB errors ----

  describe('database errors', () => {
    it('returns 409 for duplicate song', async () => {
      mockAuth(TEACHER_ID);
      mockAdminClient(
        { is_admin: false, is_teacher: true },
        { data: null, error: { code: '23505', message: 'duplicate key' } }
      );
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockResolvedValue(MOCK_FEATURES);

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toContain('already exists');
    });

    it('returns 500 for generic DB error', async () => {
      mockAuth(TEACHER_ID);
      mockAdminClient(
        { is_admin: false, is_teacher: true },
        { data: null, error: { code: '42000', message: 'something broke' } }
      );
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockResolvedValue(MOCK_FEATURES);

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(500);
    });
  });

  // ---- Happy path ----

  describe('happy path', () => {
    it('creates a draft song from Spotify URL with all metadata', async () => {
      mockAuth(TEACHER_ID);
      const createdSong = {
        id: 'new-song-id',
        title: 'Wonderwall',
        author: 'Oasis',
        key: 'F#',
        tempo: 88,
        time_signature: 4,
        duration_ms: 258000,
        release_year: 1995,
        spotify_link_url: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
        cover_image_url: 'https://i.scdn.co/image/cover.jpg',
      };
      mockAdminClient({ is_admin: false, is_teacher: true }, { data: createdSong, error: null });
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockResolvedValue(MOCK_FEATURES);

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.song.title).toBe('Wonderwall');
      expect(body.song.author).toBe('Oasis');
      expect(body.source).toBe('spotify');
      expect(body.track_id).toBe('3n3Ppam7vgaVa1iaRUc9Lp');
    });

    it('passes the correct draft data to supabase insert', async () => {
      mockAuth(TEACHER_ID);
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockResolvedValue(MOCK_FEATURES);

      const insertFn = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: 'new-song-id' },
            error: null,
          }),
        }),
      });

      let callCount = 0;
      const adminMock = {
        from: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { is_admin: false, is_teacher: true, is_development: false },
                    error: null,
                  }),
                }),
              }),
            };
          }
          return { insert: insertFn };
        }),
      };
      (createAdminClient as jest.Mock).mockReturnValue(adminMock);

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_valid_key');
      await POST(req);

      expect(insertFn).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Wonderwall',
          author: 'Oasis',
          is_draft: true,
          spotify_link_url: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
          ultimate_guitar_link: null,
          youtube_url: null,
        })
      );
    });

    it('accepts spotify: URI format', async () => {
      mockAuth(TEACHER_ID);
      mockAdminClient({ is_admin: false, is_teacher: true });
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockResolvedValue(MOCK_FEATURES);

      const req = makeRequest(
        { spotify_url: 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp' },
        'gcrm_valid_key'
      );
      const res = await POST(req);

      expect(res.status).toBe(201);
      expect(getTrack).toHaveBeenCalledWith('3n3Ppam7vgaVa1iaRUc9Lp');
    });
  });
});
