/**
 * @jest-environment node
 *
 * Unit tests for GET + PUT + DELETE /api/lessons/songs/[id]
 */

import { GET, PUT, DELETE } from '@/app/api/lessons/songs/[id]/route';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const LESSON_SONG_ID = '776dfd64-c31a-45dc-b32b-a365f3ebd4b9';

const mockAdminContext = {
  user: { id: 'admin-user-id' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
};
const mockTeacherContext = {
  user: { id: 'teacher-user-id' },
  roles: { isAdmin: false, isTeacher: true, isStudent: false },
};
const mockStudentContext = {
  user: { id: 'student-user-id' },
  roles: { isAdmin: false, isTeacher: false, isStudent: true },
};

const paramsPromise = Promise.resolve({ id: LESSON_SONG_ID });

function makeRequest(method = 'GET', body?: unknown): NextRequest {
  return new NextRequest(`http://localhost/api/lessons/songs/${LESSON_SONG_ID}`, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

function buildGetMock(data: unknown, error: { code?: string; message: string } | null = null) {
  const builder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
  };
  return { from: jest.fn().mockReturnValue(builder) };
}

function buildUpdateMock(data: unknown, error: { code?: string; message: string } | null = null) {
  const builder = {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data, error }),
  };
  return { from: jest.fn().mockReturnValue(builder) };
}

function buildDeleteMock(error: { code?: string; message: string } | null = null) {
  const builder = {
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ error }),
  };
  return { from: jest.fn().mockReturnValue(builder) };
}

describe('GET /api/lessons/songs/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockAdminContext) => Promise<Response>) =>
        handler(mockAdminContext)
    );
  });

  it('returns lesson song with joined data on success', async () => {
    const lessonSong = { id: LESSON_SONG_ID, status: 'started', song: { title: 'Blackbird' } };
    (createClient as jest.Mock).mockResolvedValue(buildGetMock(lessonSong));

    const res = await GET(makeRequest(), { params: paramsPromise });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe(LESSON_SONG_ID);
  });

  it('PGRST116 error returns 404 with correct message', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildGetMock(null, { code: 'PGRST116', message: 'no rows' })
    );

    const res = await GET(makeRequest(), { params: paramsPromise });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Lesson song assignment not found');
  });

  it('other DB error returns 500', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildGetMock(null, { message: 'connection error' })
    );

    const res = await GET(makeRequest(), { params: paramsPromise });
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/lessons/songs/[id]', () => {
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
    (createClient as jest.Mock).mockResolvedValue(buildUpdateMock(null));

    const res = await PUT(makeRequest('PUT', { status: 'mastered' }), { params: paramsPromise });
    expect(res.status).toBe(403);
  });

  it('invalid status value returns 400', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildUpdateMock(null));

    const res = await PUT(makeRequest('PUT', { status: 'INVALID' }), { params: paramsPromise });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid song status');
  });

  it('valid status update succeeds', async () => {
    const updatedRow = { id: LESSON_SONG_ID, status: 'mastered' };
    (createClient as jest.Mock).mockResolvedValue(buildUpdateMock(updatedRow));

    const res = await PUT(makeRequest('PUT', { status: 'mastered' }), { params: paramsPromise });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('mastered');
  });

  it('DB error on update returns 500', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildUpdateMock(null, { message: 'update failed' })
    );

    const res = await PUT(makeRequest('PUT', { status: 'mastered' }), { params: paramsPromise });
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/lessons/songs/[id]', () => {
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
    (createClient as jest.Mock).mockResolvedValue(buildDeleteMock());

    const res = await DELETE(makeRequest('DELETE'), { params: paramsPromise });
    expect(res.status).toBe(403);
  });

  it('successful delete returns 200 with success true', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildDeleteMock(null));

    const res = await DELETE(makeRequest('DELETE'), { params: paramsPromise });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('DB error returns 500', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildDeleteMock({ message: 'delete failed' }));

    const res = await DELETE(makeRequest('DELETE'), { params: paramsPromise });
    expect(res.status).toBe(500);
  });
});
