/**
 * @jest-environment node
 *
 * Tests for POST /api/song with API key authentication.
 * The route now supports both cookie-based and API key bearer token auth
 * via the withApiAuth wrapper.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { AuthedProfile } from '@/lib/auth/loadAuthedProfile';

// Must mock before importing the route (module-level side effects)
jest.mock('@/lib/supabase/admin');
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/supabase/config', () => ({
  getSupabaseConfig: jest.fn().mockReturnValue({
    url: 'http://localhost:54321',
    anonKey: 'test-anon-key',
  }),
}));
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    getAll: jest.fn().mockReturnValue([]),
    set: jest.fn(),
  }),
}));
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

// Import route after mocks are in place
import { POST } from '../route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEACHER_ID = '45085573-07bc-475b-b8f2-baeae18ffb4e';
const ADMIN_ID = '8f842809-facd-4de4-9b8d-4de8444b145a';
const STUDENT_ID = '69590a6f-5873-428b-8e37-9c1306f26757';

const VALID_SONG = {
  title: 'Wonderwall',
  author: 'Oasis',
  level: 'intermediate',
  key: 'Em',
  ultimate_guitar_link: 'https://ultimate-guitar.com/tabs/123',
  youtube_url: null,
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

const DEV_TEACHER_PROFILE: AuthedProfile = {
  user: { id: TEACHER_ID, email: 'dev@test.com' } as AuthedProfile['user'],
  roles: { isAdmin: false, isTeacher: true, isStudent: false },
  flags: { isParent: false, isDevelopment: true },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: Record<string, unknown>, apiKey: string): Request {
  return new Request('http://localhost:3000/api/song', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Mock the admin client for song insert only.
 * withApiAuth now handles auth — createAdminClient is only used for DB ops.
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
              data: { id: 'new-song-id', ...VALID_SONG },
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

describe('POST /api/song (API key auth)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthAs(null);
  });

  // ---- Auth ----

  describe('authentication', () => {
    it('returns 401 for unauthenticated request', async () => {
      mockAuthAs(null);

      const req = makeRequest(VALID_SONG, 'gcrm_bad_key');
      const res = await POST(req);

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  // ---- Authorization (role checks) ----

  describe('authorization', () => {
    it('returns 403 when API key user is a student', async () => {
      mockAuthAs(STUDENT_PROFILE);
      mockAdminClientInsert();

      const req = makeRequest(VALID_SONG, 'gcrm_student_key');
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toContain('Only teachers and admins');
    });

    it('returns 403 when API key user is a development/test account', async () => {
      mockAuthAs(DEV_TEACHER_PROFILE);
      mockAdminClientInsert();

      const req = makeRequest(VALID_SONG, 'gcrm_dev_key');
      const res = await POST(req);

      expect(res.status).toBe(403);
    });

    it('allows teacher to create song via API key', async () => {
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert({ data: { id: 'created-id', ...VALID_SONG }, error: null });

      const req = makeRequest(VALID_SONG, 'gcrm_teacher_key');
      const res = await POST(req);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.title).toBe('Wonderwall');
    });

    it('allows admin to create song via API key', async () => {
      mockAuthAs(ADMIN_PROFILE);
      mockAdminClientInsert({ data: { id: 'created-id', ...VALID_SONG }, error: null });

      const req = makeRequest(VALID_SONG, 'gcrm_admin_key');
      const res = await POST(req);

      expect(res.status).toBe(201);
    });
  });

  // ---- Validation ----

  describe('validation', () => {
    it('returns 422 for invalid song data (missing title)', async () => {
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert();

      const req = makeRequest({ author: 'Artist', level: 'beginner', key: 'C' }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toContain('Validation failed');
    });

    it('returns 422 for invalid level enum', async () => {
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert();

      const req = makeRequest({ ...VALID_SONG, level: 'expert' }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(422);
    });

    it('returns 422 for invalid key enum', async () => {
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert();

      const req = makeRequest({ ...VALID_SONG, key: 'X#' }, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(422);
    });
  });

  // ---- DB errors ----

  describe('database errors', () => {
    it('returns 409 for duplicate song', async () => {
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert({ data: null, error: { code: '23505', message: 'duplicate key' } });

      const req = makeRequest(VALID_SONG, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toContain('already exists');
    });

    it('returns 500 for generic DB error', async () => {
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert({ data: null, error: { code: '42000', message: 'connection failed' } });

      const req = makeRequest(VALID_SONG, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(500);
    });
  });

  // ---- Happy path variations ----

  describe('happy path', () => {
    it('creates song with minimal required fields', async () => {
      const minimalSong = {
        title: 'Simple Song',
        author: 'Artist',
        level: 'beginner',
        key: 'C',
        ultimate_guitar_link: null,
        youtube_url: null,
      };

      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert({ data: { id: 'created-id', ...minimalSong }, error: null });

      const req = makeRequest(minimalSong, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(201);
    });

    it('creates song with all optional fields', async () => {
      const fullSong = {
        ...VALID_SONG,
        chords: 'Em G D A',
        tempo: 128,
        capo_fret: 2,
        strumming_pattern: 'DDUUDU',
        category: 'rock',
        time_signature: 4,
        duration_ms: 258000,
        release_year: 1995,
        short_title: 'Wall',
        notes: 'Great for beginners',
        spotify_link_url: 'https://open.spotify.com/track/abc',
        cover_image_url: 'https://example.com/cover.jpg',
      };

      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert({ data: { id: 'created-id', ...fullSong }, error: null });

      const req = makeRequest(fullSong, 'gcrm_valid_key');
      const res = await POST(req);

      expect(res.status).toBe(201);
    });

    it('uses withApiAuth for authentication', async () => {
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert({ data: { id: 'created-id', ...VALID_SONG }, error: null });

      const req = makeRequest(VALID_SONG, 'gcrm_valid_key');
      await POST(req);

      const { withApiAuth } = await import('@/lib/auth/withApiAuth');
      expect(withApiAuth).toHaveBeenCalledTimes(1);
    });

    it('uses admin client for DB operations when using API key', async () => {
      mockAuthAs(TEACHER_PROFILE);
      mockAdminClientInsert({ data: { id: 'created-id', ...VALID_SONG }, error: null });

      const req = makeRequest(VALID_SONG, 'gcrm_valid_key');
      await POST(req);

      expect(createAdminClient).toHaveBeenCalled();
    });
  });
});
