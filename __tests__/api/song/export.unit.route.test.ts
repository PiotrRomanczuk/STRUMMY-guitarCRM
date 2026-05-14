// @jest-environment node

/**
 * Unit tests for GET /api/song/export
 * Uses withApiAuth mock (unlike the integration test which uses authenticateRequest).
 * Focuses on format handling, filter application, and auth/permission guards.
 *
 * Note: NextResponse constructor (new NextResponse(string, ...)) is not available in
 * the jest-node environment. We provide a MockNextResponse that extends Response so the
 * export route's binary-body responses are constructable and have .text() / .json().
 */

import { GET } from '@/app/api/song/export/route';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }),
}));

// Override the global next/server mock from jest.setup.js so that the export route's
// `new NextResponse(string, { headers })` is constructable and .text()/.json() work.
// We don't use jest.requireActual because loading the real next/server requires the
// global `Response` API which is unavailable in the jest-node environment.
jest.mock('next/server', () => {
  class MockNextRequest {
    url: string;
    method: string;
    headers: Headers;
    nextUrl: URL;
    private _body: string | undefined;

    constructor(url: string, init?: RequestInit) {
      this.url = url;
      this.method = (init?.method as string) || 'GET';
      this.headers = new Headers(init?.headers as HeadersInit);
      this.nextUrl = new URL(url);
      this._body = init?.body as string | undefined;
    }

    async json() {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
    }
  }

  class MockNextResponse {
    status: number;
    headers: Headers;
    private _body: string;

    constructor(body: string, init?: ResponseInit) {
      this._body = body;
      this.status = init?.status ?? 200;
      this.headers = new Headers(init?.headers as HeadersInit);
    }

    async json() {
      return JSON.parse(this._body);
    }

    async text() {
      return this._body;
    }

    static json(body: unknown, init?: ResponseInit) {
      return new MockNextResponse(JSON.stringify(body), {
        ...init,
        headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
      });
    }
  }

  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse };
});

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

const MOCK_SONGS = [
  {
    id: '1',
    title: 'Wonderwall',
    author: 'Oasis',
    level: 'intermediate',
    key: 'Em',
    chords: 'Em G D A',
    ultimate_guitar_link: null,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Hotel California',
    author: 'Eagles',
    level: 'advanced',
    key: 'Bm',
    chords: 'Bm F#',
    ultimate_guitar_link: null,
    created_at: '2025-01-02T00:00:00Z',
  },
];

function buildExportClient(
  songs: unknown[] = MOCK_SONGS,
  error: { message: string } | null = null
) {
  const result = { data: songs, error };
  const chain: Record<string, jest.Mock> = {};
  const methods = ['select', 'eq', 'ilike', 'not', 'is'];
  for (const m of methods) {
    chain[m] = jest.fn().mockReturnValue(chain);
  }
  chain.order = jest.fn().mockResolvedValue(result);
  const from = jest.fn().mockReturnValue(chain);
  return { from, _chain: chain };
}

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const sp = new URLSearchParams(params).toString();
  return new NextRequest(`http://localhost/api/song/export${sp ? `?${sp}` : ''}`);
}

beforeEach(() => {
  jest.clearAllMocks();
  (withApiAuth as jest.Mock).mockImplementation(
    async (_req: unknown, handler: (ctx: typeof adminCtx) => unknown) => handler(adminCtx)
  );
});

describe('GET /api/song/export', () => {
  describe('auth & permissions', () => {
    it('returns 401 when not authenticated', async () => {
      (withApiAuth as jest.Mock).mockResolvedValueOnce(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );
      const res = await GET(makeRequest());
      expect(res.status).toBe(401);
    });

    it('returns 403 for student role', async () => {
      (withApiAuth as jest.Mock).mockImplementation(
        async (_req: unknown, handler: (ctx: typeof studentCtx) => unknown) => handler(studentCtx)
      );
      const res = await GET(makeRequest());
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toBe('Forbidden');
    });

    it('allows teacher role', async () => {
      (withApiAuth as jest.Mock).mockImplementation(
        async (_req: unknown, handler: (ctx: typeof teacherCtx) => unknown) => handler(teacherCtx)
      );
      (createClient as jest.Mock).mockResolvedValue(buildExportClient());
      const res = await GET(makeRequest({ format: 'json' }));
      expect(res.status).toBe(200);
    });

    it('allows admin role', async () => {
      (createClient as jest.Mock).mockResolvedValue(buildExportClient());
      const res = await GET(makeRequest({ format: 'json' }));
      expect(res.status).toBe(200);
    });
  });

  describe('JSON format', () => {
    it('returns JSON array of songs', async () => {
      (createClient as jest.Mock).mockResolvedValue(buildExportClient());
      const res = await GET(makeRequest({ format: 'json' }));
      expect(res.status).toBe(200);
      const text = await res.text();
      const parsed = JSON.parse(text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
    });

    it('sets Content-Disposition header with songs.json filename', async () => {
      (createClient as jest.Mock).mockResolvedValue(buildExportClient());
      const res = await GET(makeRequest({ format: 'json' }));
      const disposition = res.headers.get('Content-Disposition');
      expect(disposition).toContain('songs.json');
    });

    it('defaults to JSON when no format param supplied', async () => {
      (createClient as jest.Mock).mockResolvedValue(buildExportClient());
      const res = await GET(makeRequest());
      expect(res.status).toBe(200);
      const contentType = res.headers.get('Content-Type');
      expect(contentType).toContain('application/json');
    });
  });

  describe('CSV format', () => {
    it('returns CSV with header row containing expected columns', async () => {
      (createClient as jest.Mock).mockResolvedValue(buildExportClient());
      const res = await GET(makeRequest({ format: 'csv' }));
      expect(res.status).toBe(200);
      const text = await res.text();
      const firstLine = text.split('\n')[0];
      expect(firstLine).toContain('title');
      expect(firstLine).toContain('author');
    });

    it('returns correct number of data rows (header + songs)', async () => {
      (createClient as jest.Mock).mockResolvedValue(buildExportClient());
      const res = await GET(makeRequest({ format: 'csv' }));
      const text = await res.text();
      const lines = text.split('\n');
      expect(lines).toHaveLength(MOCK_SONGS.length + 1);
    });

    it('sets Content-Disposition header with songs.csv filename', async () => {
      (createClient as jest.Mock).mockResolvedValue(buildExportClient());
      const res = await GET(makeRequest({ format: 'csv' }));
      const disposition = res.headers.get('Content-Disposition');
      expect(disposition).toContain('songs.csv');
    });
  });

  describe('PDF format', () => {
    it('returns JSON payload with songs and metadata for PDF', async () => {
      (createClient as jest.Mock).mockResolvedValue(buildExportClient());
      const res = await GET(makeRequest({ format: 'pdf' }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('songs');
      expect(body).toHaveProperty('metadata');
      expect(body.metadata.total).toBe(MOCK_SONGS.length);
    });
  });

  describe('schema validation', () => {
    it('returns 400 for unsupported format', async () => {
      (createClient as jest.Mock).mockResolvedValue(buildExportClient());
      const res = await GET(makeRequest({ format: 'xlsx' }));
      expect(res.status).toBe(400);
    });
  });

  describe('filter application', () => {
    it('applies level filter via .eq()', async () => {
      const { _chain } = buildExportClient();
      (createClient as jest.Mock).mockResolvedValue({ from: jest.fn().mockReturnValue(_chain) });
      await GET(makeRequest({ level: 'beginner' }));
      const eqCalls: [string, string][] = _chain.eq.mock.calls;
      expect(eqCalls.some(([field]) => field === 'level')).toBe(true);
    });

    it('applies key filter via .eq()', async () => {
      const { _chain } = buildExportClient();
      (createClient as jest.Mock).mockResolvedValue({ from: jest.fn().mockReturnValue(_chain) });
      await GET(makeRequest({ key: 'C' }));
      const eqCalls: [string, string][] = _chain.eq.mock.calls;
      expect(eqCalls.some(([field]) => field === 'key')).toBe(true);
    });

    it('applies author filter via .ilike()', async () => {
      const { _chain } = buildExportClient();
      (createClient as jest.Mock).mockResolvedValue({ from: jest.fn().mockReturnValue(_chain) });
      await GET(makeRequest({ author: 'Beatles' }));
      const ilikeCalls: [string, string][] = _chain.ilike.mock.calls;
      expect(ilikeCalls.some(([field]) => field === 'author')).toBe(true);
    });
  });

  describe('DB error handling', () => {
    it('returns 500 on DB error', async () => {
      (createClient as jest.Mock).mockResolvedValue(
        buildExportClient([], { message: 'connection refused' })
      );
      const res = await GET(makeRequest({ format: 'json' }));
      expect(res.status).toBe(500);
    });
  });
});
