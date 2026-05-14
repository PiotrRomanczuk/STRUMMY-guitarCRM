/**
 * @jest-environment node
 *
 * Unit tests for GET /api/lessons/export
 */

import { GET } from '@/app/api/lessons/export/route';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

// NextResponse constructor is not available in the jest-node environment;
// stub it so the export route's `new NextResponse(body, headers)` works.
jest.mock('next/server', () => {
  const actual = jest.requireActual<typeof import('next/server')>('next/server');

  class MockNextResponse extends Response {
    static json(body: unknown, init?: ResponseInit) {
      return new MockNextResponse(JSON.stringify(body), {
        ...init,
        headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
      });
    }
  }

  return { ...actual, NextResponse: MockNextResponse, NextRequest: actual.NextRequest };
});

const mockAdminContext = {
  user: { id: 'admin-user-id' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
};

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/lessons/export');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString());
}

interface LessonRow {
  id: string;
  title: string;
  student_id: string;
  teacher_id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function buildSupabaseMock(rows: LessonRow[] | null, error: { message: string } | null = null) {
  const builder = {
    select: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: rows, error }),
  };
  return { from: jest.fn().mockReturnValue(builder) };
}

describe('GET /api/lessons/export', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockAdminContext) => Promise<Response>) =>
        handler(mockAdminContext)
    );
  });

  it('returns 401 when withApiAuth rejects', async () => {
    (withApiAuth as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('default format=json returns JSON content-type', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock([]));

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');
  });

  it('invalid status param returns 400 with Invalid status filter', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock([]));

    const res = await GET(makeRequest({ status: 'INVALID_STATUS' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid status filter');
  });

  it('valid status filter applies .eq on status', async () => {
    const mock = buildSupabaseMock([]);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const res = await GET(makeRequest({ status: 'completed' }));
    expect(res.status).toBe(200);

    const builder = mock.from.mock.results[0]?.value;
    expect(builder.eq).toHaveBeenCalledWith('status', 'COMPLETED');
  });

  it('userId param applies .or() filter', async () => {
    const userId = '00000000-0000-0000-0000-000000000004';
    const mock = buildSupabaseMock([]);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const res = await GET(makeRequest({ userId }));
    expect(res.status).toBe(200);

    const builder = mock.from.mock.results[0]?.value;
    expect(builder.or).toHaveBeenCalledWith(`student_id.eq.${userId},teacher_id.eq.${userId}`);
  });

  it('includeSongs=true adds lesson_songs to select', async () => {
    const mock = buildSupabaseMock([]);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const res = await GET(makeRequest({ includeSongs: 'true' }));
    expect(res.status).toBe(200);

    const builder = mock.from.mock.results[0]?.value;
    const selectArg: string = builder.select.mock.calls[0][0];
    expect(selectArg).toContain('lesson_songs');
  });

  it('includeProfiles=true adds profile joins to select', async () => {
    const mock = buildSupabaseMock([]);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const res = await GET(makeRequest({ includeProfiles: 'true' }));
    expect(res.status).toBe(200);

    const builder = mock.from.mock.results[0]?.value;
    const selectArg: string = builder.select.mock.calls[0][0];
    expect(selectArg).toContain('profiles');
  });

  it('DB error returns 500', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildSupabaseMock(null, { message: 'DB failure' })
    );

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
