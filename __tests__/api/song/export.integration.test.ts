/**
 * Integration tests for Song Export API route.
 *
 * Tests the GET /api/song/export endpoint by mocking authenticateRequest and
 * createAdminClient. Covers auth, JSON export, CSV export, and schema validation.
 */

import { authenticateRequest } from '@/lib/auth/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// Mock next/server — provide both NextRequest and a constructable NextResponse
// ---------------------------------------------------------------------------
class MockNextResponse {
  body: string;
  status: number;
  headers: Headers;

  constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
    this.body = body;
    this.status = init?.status ?? 200;
    this.headers = new Headers(init?.headers);
  }

  async json() {
    return JSON.parse(this.body);
  }

  async text() {
    return this.body;
  }

  static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
    return new MockNextResponse(JSON.stringify(data), init);
  }
}

class MockNextRequest {
  url: string;
  method: string;
  nextUrl: URL;
  headers: Headers;

  constructor(url: string | URL, init?: { method?: string }) {
    this.url = typeof url === 'string' ? url : url.toString();
    this.method = init?.method ?? 'GET';
    this.nextUrl = new URL(this.url);
    this.headers = new Headers();
  }
}

jest.mock('next/server', () => ({
  NextRequest: MockNextRequest,
  NextResponse: MockNextResponse,
}));

// Must import GET *after* the mock is registered so it picks up MockNextResponse
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GET } = require('@/app/api/song/export/route');

jest.mock('@/lib/auth/api-auth', () => ({
  authenticateRequest: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MOCK_TEACHER_ID = '00000000-bbbb-4000-a000-000000000002';
const MOCK_STUDENT_ID = '00000000-cccc-4000-a000-000000000003';

const mockSongs = [
  {
    id: '1',
    title: 'Wonderwall',
    author: 'Oasis',
    level: 'intermediate',
    key: 'Em',
    chords: 'Em G D A',
    ultimate_guitar_link: 'https://tabs.ultimate-guitar.com/tab/wonderwall',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Hotel California',
    author: 'Eagles',
    level: 'advanced',
    key: 'Bm',
    chords: 'Bm F# A E',
    ultimate_guitar_link: null,
    created_at: '2025-01-02T00:00:00Z',
  },
  {
    id: '3',
    title: 'Wish You Were Here',
    author: 'Pink Floyd',
    level: 'beginner',
    key: 'G',
    chords: 'Em G',
    ultimate_guitar_link: null,
    created_at: '2025-01-03T00:00:00Z',
  },
];

function buildRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost:3000/api/song/export');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new MockNextRequest(url);
}

function buildSongQueryBuilder(songs: typeof mockSongs = mockSongs) {
  const builder: Record<string, jest.Mock> = {};
  const chainable = ['select', 'eq', 'ilike', 'is', 'order'];
  for (const m of chainable) {
    builder[m] = jest.fn().mockReturnValue(builder);
  }
  builder.order = jest.fn().mockResolvedValue({ data: songs, error: null });
  return builder;
}

function buildProfileQueryBuilder(role: 'admin' | 'teacher' | 'student') {
  const profile = {
    is_admin: role === 'admin',
    is_teacher: role === 'teacher' || role === 'admin',
  };
  const builder: Record<string, jest.Mock> = {};
  builder.select = jest.fn().mockReturnValue(builder);
  builder.eq = jest.fn().mockReturnValue(builder);
  builder.single = jest.fn().mockResolvedValue({ data: profile, error: null });
  return builder;
}

function setupMockClient(options: {
  userId: string | null;
  role: 'admin' | 'teacher' | 'student';
  songs?: typeof mockSongs;
}) {
  const songQb = buildSongQueryBuilder(options.songs ?? mockSongs);
  const profileQb = buildProfileQueryBuilder(options.role);

  const client = {
    from: jest.fn((table: string) => {
      if (table === 'profiles') return profileQb;
      return songQb;
    }),
  };

  (authenticateRequest as jest.Mock).mockResolvedValue(
    options.userId
      ? { user: { id: options.userId }, status: 200 }
      : { user: null, error: 'Unauthorized', status: 401 }
  );
  (createAdminClient as jest.Mock).mockReturnValue(client);
  return { client, songQb, profileQb };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Song Export API – Integration Tests', () => {
  afterEach(() => jest.clearAllMocks());

  describe('Auth & Permissions', () => {
    it('returns 401 when not authenticated', async () => {
      setupMockClient({ userId: null, role: 'student' });
      const res = await GET(buildRequest());

      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 403 when user is student', async () => {
      const profileQb: Record<string, jest.Mock> = {};
      profileQb.select = jest.fn().mockReturnValue(profileQb);
      profileQb.eq = jest.fn().mockReturnValue(profileQb);
      profileQb.single = jest.fn().mockResolvedValue({
        data: { is_admin: false, is_teacher: false },
        error: null,
      });

      (authenticateRequest as jest.Mock).mockResolvedValue({
        user: { id: MOCK_STUDENT_ID },
        status: 200,
      });
      (createAdminClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(profileQb),
      });

      const res = await GET(buildRequest());
      expect(res.status).toBe(403);
    });

    it('allows teacher to export', async () => {
      setupMockClient({ userId: MOCK_TEACHER_ID, role: 'teacher' });
      const res = await GET(buildRequest());
      expect(res.status).toBe(200);
    });

    it('allows admin to export', async () => {
      setupMockClient({ userId: MOCK_TEACHER_ID, role: 'admin' });
      const res = await GET(buildRequest());
      expect(res.status).toBe(200);
    });
  });

  describe('JSON export', () => {
    it('returns valid JSON array with song objects', async () => {
      setupMockClient({ userId: MOCK_TEACHER_ID, role: 'teacher' });
      const res = await GET(buildRequest({ format: 'json' }));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(3);
    });

    it('each song has title, author, level, key fields', async () => {
      setupMockClient({ userId: MOCK_TEACHER_ID, role: 'teacher' });
      const res = await GET(buildRequest({ format: 'json' }));
      const body = await res.json();

      for (const song of body) {
        expect(song).toHaveProperty('title');
        expect(song).toHaveProperty('author');
        expect(song).toHaveProperty('level');
        expect(song).toHaveProperty('key');
      }
    });

    it('applies level filter when provided', async () => {
      const { songQb } = setupMockClient({ userId: MOCK_TEACHER_ID, role: 'teacher' });
      await GET(buildRequest({ format: 'json', level: 'beginner' }));
      expect(songQb.eq).toHaveBeenCalledWith('level', 'beginner');
    });

    it('applies key filter when provided', async () => {
      const { songQb } = setupMockClient({ userId: MOCK_TEACHER_ID, role: 'teacher' });
      await GET(buildRequest({ format: 'json', key: 'Em' }));
      expect(songQb.eq).toHaveBeenCalledWith('key', 'Em');
    });
  });

  describe('CSV export', () => {
    it('returns CSV with header row', async () => {
      setupMockClient({ userId: MOCK_TEACHER_ID, role: 'teacher' });
      const res = await GET(buildRequest({ format: 'csv' }));

      expect(res.status).toBe(200);
      const text = await res.text();
      const lines = text.split('\n');
      const headers = lines[0];
      expect(headers).toContain('title');
      expect(headers).toContain('author');
      expect(headers).toContain('level');
      expect(headers).toContain('key');
    });

    it('returns data rows matching song count', async () => {
      setupMockClient({ userId: MOCK_TEACHER_ID, role: 'teacher' });
      const res = await GET(buildRequest({ format: 'csv' }));
      const text = await res.text();
      const lines = text.split('\n');
      expect(lines).toHaveLength(4); // header + 3 data rows
    });

    it('properly escapes quotes in field values', async () => {
      const songsWithQuotes = [
        {
          id: '10',
          title: 'She said "hello"',
          author: 'Test',
          level: 'beginner',
          key: 'C',
          chords: null,
          ultimate_guitar_link: null,
          created_at: '2025-01-01T00:00:00Z',
        },
      ];
      setupMockClient({ userId: MOCK_TEACHER_ID, role: 'teacher', songs: songsWithQuotes });
      const res = await GET(buildRequest({ format: 'csv' }));
      const text = await res.text();
      expect(text).toContain('""hello""');
    });

    it('sets Content-Disposition header with filename', async () => {
      setupMockClient({ userId: MOCK_TEACHER_ID, role: 'teacher' });
      const res = await GET(buildRequest({ format: 'csv' }));
      const disposition = res.headers.get('Content-Disposition');
      expect(disposition).toContain('songs.csv');
    });
  });

  describe('Schema validation', () => {
    it('returns 400 for invalid format param', async () => {
      setupMockClient({ userId: MOCK_TEACHER_ID, role: 'teacher' });
      const res = await GET(buildRequest({ format: 'xlsx' }));
      expect(res.status).toBe(400);
    });

    it('defaults to JSON when no format specified', async () => {
      setupMockClient({ userId: MOCK_TEACHER_ID, role: 'teacher' });
      const res = await GET(buildRequest());
      expect(res.status).toBe(200);
      const contentType = res.headers.get('Content-Type');
      expect(contentType).toContain('application/json');
    });

    it('accepts all valid formats: json, csv, pdf', async () => {
      for (const format of ['json', 'csv', 'pdf']) {
        setupMockClient({ userId: MOCK_TEACHER_ID, role: 'teacher' });
        const res = await GET(buildRequest({ format }));
        expect(res.status).toBe(200);
      }
    });
  });
});
