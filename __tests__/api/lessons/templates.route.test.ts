/**
 * @jest-environment node
 *
 * Unit tests for GET + POST /api/lessons/templates
 */

import { GET, POST } from '@/app/api/lessons/templates/route';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const TEACHER_ID = '6225d9a5-fb1b-4beb-bf43-1c9a15ab42d0';
const TEMPLATE_ID = '8b05e729-4c89-415b-83a1-1e1eccd6cac3';

const mockAdminContext = {
  user: { id: 'admin-user-id' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
};
const mockTeacherContext = {
  user: { id: TEACHER_ID },
  roles: { isAdmin: false, isTeacher: true, isStudent: false },
};
const mockStudentContext = {
  user: { id: 'student-user-id' },
  roles: { isAdmin: false, isTeacher: false, isStudent: true },
};

function makeGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/lessons/templates');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/lessons/templates', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function buildGetMock(rows: unknown[] | null, error: { message: string } | null = null) {
  const builder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: rows, error }),
  };
  return { from: jest.fn().mockReturnValue(builder) };
}

function buildInsertMock(data: unknown, error: { message: string } | null = null) {
  const builder = {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
  };
  return { from: jest.fn().mockReturnValue(builder) };
}

describe('GET /api/lessons/templates', () => {
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
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(401);
  });

  it('returns templates array', async () => {
    const templates = [{ id: TEMPLATE_ID, name: 'Beginner Session', category: 'beginner' }];
    (createClient as jest.Mock).mockResolvedValue(buildGetMock(templates));

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.templates)).toBe(true);
    expect(body.templates).toHaveLength(1);
  });

  it('category param applies .eq filter', async () => {
    const mock = buildGetMock([]);
    (createClient as jest.Mock).mockResolvedValue(mock);

    await GET(makeGetRequest({ category: 'beginner' }));

    const builder = mock.from.mock.results[0]?.value;
    expect(builder.eq).toHaveBeenCalledWith('category', 'beginner');
  });

  it('teacherId param applies .eq filter', async () => {
    const mock = buildGetMock([]);
    (createClient as jest.Mock).mockResolvedValue(mock);

    await GET(makeGetRequest({ teacherId: TEACHER_ID }));

    const builder = mock.from.mock.results[0]?.value;
    expect(builder.eq).toHaveBeenCalledWith('teacher_id', TEACHER_ID);
  });

  it('table-not-found error (message includes lesson_templates) returns { templates: [] }', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildGetMock(null, { message: 'relation "lesson_templates" does not exist' })
    );

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ templates: [] });
  });

  it('other DB error returns 500', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildGetMock(null, { message: 'connection refused' })
    );

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
  });
});

describe('POST /api/lessons/templates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockTeacherContext) => Promise<Response>) =>
        handler(mockTeacherContext)
    );
  });

  it('student role returns 403', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockStudentContext) => Promise<Response>) =>
        handler(mockStudentContext)
    );
    (createClient as jest.Mock).mockResolvedValue(buildInsertMock(null));

    const res = await POST(
      makePostRequest({ name: 'Test', category: 'beginner', teacher_id: TEACHER_ID })
    );
    expect(res.status).toBe(403);
  });

  it('missing name returns 400 validation error', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildInsertMock(null));

    const res = await POST(makePostRequest({ category: 'beginner', teacher_id: TEACHER_ID }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('missing category returns 400 validation error', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildInsertMock(null));

    const res = await POST(makePostRequest({ name: 'Test', teacher_id: TEACHER_ID }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('invalid teacher_id UUID returns 400', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildInsertMock(null));

    const res = await POST(
      makePostRequest({ name: 'Test', category: 'beginner', teacher_id: 'not-a-uuid' })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('duration > 480 returns 400', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildInsertMock(null));

    const res = await POST(
      makePostRequest({
        name: 'Test',
        category: 'beginner',
        teacher_id: TEACHER_ID,
        duration: 600,
      })
    );
    expect(res.status).toBe(400);
  });

  it('valid payload creates template and returns 200', async () => {
    const created = { id: TEMPLATE_ID, name: 'Beginner Session', category: 'beginner' };
    (createClient as jest.Mock).mockResolvedValue(buildInsertMock(created));

    const res = await POST(
      makePostRequest({ name: 'Beginner Session', category: 'beginner', teacher_id: TEACHER_ID })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(TEMPLATE_ID);
  });

  it('DB error on insert returns 500', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildInsertMock(null, { message: 'insert failed' })
    );

    const res = await POST(
      makePostRequest({ name: 'Test', category: 'beginner', teacher_id: TEACHER_ID })
    );
    expect(res.status).toBe(500);
  });
});
