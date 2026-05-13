/**
 * @jest-environment node
 */

import { POST } from '../route';
import { createAdminClient } from '@/lib/supabase/admin';
import { getTrack, getAudioFeatures } from '@/lib/spotify';
import type { AuthedProfile } from '@/lib/auth/loadAuthedProfile';

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
// withApiAuth mock — controls what authed profile the handler receives
// ---------------------------------------------------------------------------

let _authedProfile: AuthedProfile | null = null;

jest.mock('@/lib/auth/withApiAuth', () => ({
  withApiAuth: jest.fn(
    async (_req: Request, handler: (authed: AuthedProfile, req: Request) => Promise<Response>) => {
      if (!_authedProfile) {
        const { NextResponse } = await import('next/server');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return handler(_authedProfile, _req);
    }
  ),
}));

function mockAuthAs(profile: AuthedProfile | null) {
  _authedProfile = profile;
}

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

const TEACHER_PROFILE: AuthedProfile = {
  user: { id: TEACHER_ID, email: 'teacher@test.com' } as AuthedProfile['user'],
  roles: { isAdmin: false, isTeacher: true, isStudent: false },
  flags: { isParent: false, isDevelopment: false },
};

const ADMIN_PROFILE: AuthedProfile = {
  user: { id: ADMIN_ID, email: 'admin@test.com' } as AuthedProfile['user'],
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isParent: false, isDevelopment: false },
};

const STUDENT_PROFILE: AuthedProfile = {
  user: { id: STUDENT_ID, email: 'student@test.com' } as AuthedProfile['user'],
  roles: { isAdmin: false, isTeacher: false, isStudent: true },
  flags: { isParent: false, isDevelopment: false },
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

/**
 * Mock the admin client for song insert only.
 * withApiAuth now handles auth — createAdminClient is only used for DB insert.
 */
function mockAdminClientInsert(insertResult?: {
  data?: unknown;
  error?: { code?: string; message: string } | null;
}) {
  const mock = {
    from: jest.fn().mockReturnValue({
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
    mockAuthAs(null);
  });

  // ---- Auth ----

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      mockAuthAs(null);

      const req = makeRequest({ spotify_url: SPOTIFY_URL });
      const res = await POST(req);

      expect(res.status).toBe(401);
    });

    it('returns 401 for invalid API key', async () => {
      mockAuthAs(null);

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_invalid_key');
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 403 when authenticated user is a student (not teacher/admin)', async () => {
      mockAuthAs(STUDENT_PROFILE);
      mockAdminClientInsert();

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain('Only teachers and admins');
    });

    it('allows admin users', async () => {
      mockAuthAs(ADMIN_PROFILE);
      mockAdminClientInsert();
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockResolvedValue(MOCK_FEATURES);

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_admin_key');
      const res = await POST(req);

      expect(res.status).toBe(201);
    });

    it('allows teacher users', async () => {
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert();
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
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert();

      const req = makeRequest({}, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Validation failed');
    });

    it('returns 400 for empty spotify_url', async () => {
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert();

      const req = makeRequest({ spotify_url: '' }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid Spotify URL', async () => {
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert();

      const req = makeRequest({ spotify_url: 'https://example.com/not-spotify' }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid Spotify URL or track ID');
    });

    it('returns 400 for invalid JSON body', async () => {
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert();

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
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert();
      (getTrack as jest.Mock).mockRejectedValue(new Error('Spotify API error'));

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(502);
      const body = await res.json();
      expect(body.error).toBe('Failed to fetch track from Spotify');
    });

    it('succeeds without audio features (graceful degradation)', async () => {
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert({ data: { id: 'new-song-id', title: 'Wonderwall' }, error: null });
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
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert({ data: null, error: { code: '23505', message: 'duplicate key' } });
      (getTrack as jest.Mock).mockResolvedValue(MOCK_TRACK);
      (getAudioFeatures as jest.Mock).mockResolvedValue(MOCK_FEATURES);

      const req = makeRequest({ spotify_url: SPOTIFY_URL }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toContain('already exists');
    });

    it('returns 500 for generic DB error', async () => {
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert({ data: null, error: { code: '42000', message: 'something broke' } });
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
      mockAuthAs(TEACHER_PROFILE);
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
      mockAdminClientInsert({ data: createdSong, error: null });
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
      mockAuthAs(TEACHER_PROFILE);
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

      const adminMock = {
        from: jest.fn().mockReturnValue({ insert: insertFn }),
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
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert();
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
