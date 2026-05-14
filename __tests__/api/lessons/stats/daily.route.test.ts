/**
 * @jest-environment node
 *
 * Unit tests for GET /api/lessons/stats/daily
 */

import { GET } from '@/app/api/lessons/stats/daily/route';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { NextResponse } from 'next/server';

jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn() }));
jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

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

function makeRequest(): Request {
  return new Request('http://localhost/api/lessons/stats/daily');
}

interface LessonRow {
  scheduled_at: string;
}

function buildAdminClientMock(lessons: LessonRow[], error: { message: string } | null = null) {
  const builder = {
    select: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: lessons, error }),
  };
  return { from: jest.fn().mockReturnValue(builder) };
}

describe('GET /api/lessons/stats/daily', () => {
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

  it('student role returns 403', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockStudentContext) => Promise<Response>) =>
        handler(mockStudentContext)
    );
    (createAdminClient as jest.Mock).mockReturnValue(buildAdminClientMock([]));

    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden');
  });

  it('teacher role is allowed and returns array', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockTeacherContext) => Promise<Response>) =>
        handler(mockTeacherContext)
    );
    (createAdminClient as jest.Mock).mockReturnValue(buildAdminClientMock([]));

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('returns array of { day, value } objects', async () => {
    const lessons: LessonRow[] = [
      { scheduled_at: '2026-05-01T10:00:00Z' },
      { scheduled_at: '2026-05-03T14:00:00Z' },
    ];
    (createAdminClient as jest.Mock).mockReturnValue(buildAdminClientMock(lessons));

    const res = await GET(makeRequest());
    const body = (await res.json()) as { day: string; value: number }[];

    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(2);
    expect(body[0]).toHaveProperty('day');
    expect(body[0]).toHaveProperty('value');
    expect(typeof body[0].day).toBe('string');
    expect(typeof body[0].value).toBe('number');
  });

  it('groups same-day lessons into a single count', async () => {
    const lessons: LessonRow[] = [
      { scheduled_at: '2026-05-01T09:00:00Z' },
      { scheduled_at: '2026-05-01T11:00:00Z' },
      { scheduled_at: '2026-05-01T14:00:00Z' },
      { scheduled_at: '2026-05-02T10:00:00Z' },
    ];
    (createAdminClient as jest.Mock).mockReturnValue(buildAdminClientMock(lessons));

    const res = await GET(makeRequest());
    const body = (await res.json()) as { day: string; value: number }[];

    const may1 = body.find((e) => e.day === '2026-05-01');
    const may2 = body.find((e) => e.day === '2026-05-02');

    expect(may1?.value).toBe(3);
    expect(may2?.value).toBe(1);
    expect(body).toHaveLength(2);
  });

  it('DB error returns 500', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      buildAdminClientMock([], { message: 'db error' })
    );

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });

  it('empty lessons returns empty array', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(buildAdminClientMock([]));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });
});
