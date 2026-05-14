/**
 * @jest-environment node
 *
 * Unit tests for GET /api/lessons/analytics
 */

import { GET } from '@/app/api/lessons/analytics/route';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const TEACHER_ID = '6225d9a5-fb1b-4beb-bf43-1c9a15ab42d0';
const STUDENT_ID = 'ca2e70e7-7876-4519-ac60-be785646d096';

const mockAdminContext = {
  user: { id: 'admin-user-id' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
};
const mockTeacherContext = {
  user: { id: TEACHER_ID },
  roles: { isAdmin: false, isTeacher: true, isStudent: false },
};
const mockStudentContext = {
  user: { id: STUDENT_ID },
  roles: { isAdmin: false, isTeacher: false, isStudent: true },
};
const mockNoRoleContext = {
  user: { id: 'no-role-id' },
  roles: { isAdmin: false, isTeacher: false, isStudent: false },
};

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/lessons/analytics');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString());
}

interface LessonRow {
  id: string;
  status: string;
  scheduled_at: string;
  teacher_id: string;
  student_id: string;
}

function buildSupabaseMock(lessons: LessonRow[], lessonsError: { message: string } | null = null) {
  const resolution = { data: lessons, error: lessonsError };

  // The analytics route awaits baseQuery directly (no guaranteed terminal call),
  // so the builder must be a thenable. All chaining methods return the same thenable.
  const baseBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    then: (resolve: (v: typeof resolution) => void, reject?: (e: unknown) => void) =>
      Promise.resolve(resolution).then(resolve, reject),
  };

  // For secondary queries (lesson_durations, lesson_songs, teacher metrics, time analytics)
  const emptyBuilder = {
    select: jest.fn().mockResolvedValue({ data: [], error: null }),
  };

  return {
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'lessons') return baseBuilder;
      return emptyBuilder;
    }),
  };
}

describe('GET /api/lessons/analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when withApiAuth rejects', async () => {
    (withApiAuth as jest.Mock).mockResolvedValueOnce(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it('returns 403 when user has no role', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockNoRoleContext) => Promise<Response>) => {
        return handler(mockNoRoleContext);
      }
    );
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock([]));

    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('admin can fetch analytics without role filter', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockAdminContext) => Promise<Response>) => {
        return handler(mockAdminContext);
      }
    );
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock([]));

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('overview');
    expect(body.overview).toHaveProperty('totalLessons', 0);
  });

  it('admin can filter by teacherId and studentId params', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockAdminContext) => Promise<Response>) => {
        return handler(mockAdminContext);
      }
    );
    const mock = buildSupabaseMock([]);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const res = await GET(makeRequest({ teacherId: TEACHER_ID, studentId: STUDENT_ID }));
    expect(res.status).toBe(200);

    // eq should have been called with teacher_id and student_id
    const lessonsBuilder = mock.from.mock.results[0]?.value;
    if (lessonsBuilder) {
      const eqCalls = lessonsBuilder.eq.mock.calls as [string, string][];
      const fields = eqCalls.map(([field]) => field);
      expect(fields).toContain('teacher_id');
      expect(fields).toContain('student_id');
    }
  });

  it('teacher context always scopes to own user.id, ignores teacherId param', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockTeacherContext) => Promise<Response>) => {
        return handler(mockTeacherContext);
      }
    );
    const mock = buildSupabaseMock([]);
    (createClient as jest.Mock).mockResolvedValue(mock);

    // Pass a different teacherId — should be ignored; own id should be used
    const res = await GET(makeRequest({ teacherId: 'other-teacher-id' }));
    expect(res.status).toBe(200);

    const lessonsBuilder = mock.from.mock.results[0]?.value;
    if (lessonsBuilder) {
      const eqCalls = lessonsBuilder.eq.mock.calls as [string, string][];
      const teacherEq = eqCalls.find(([field]) => field === 'teacher_id');
      expect(teacherEq?.[1]).toBe(TEACHER_ID);
    }
  });

  it('student context scopes to own user.id', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockStudentContext) => Promise<Response>) => {
        return handler(mockStudentContext);
      }
    );
    const mock = buildSupabaseMock([]);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const lessonsBuilder = mock.from.mock.results[0]?.value;
    if (lessonsBuilder) {
      const eqCalls = lessonsBuilder.eq.mock.calls as [string, string][];
      const studentEq = eqCalls.find(([field]) => field === 'student_id');
      expect(studentEq?.[1]).toBe(STUDENT_ID);
    }
  });

  it('applies dateFrom and dateTo params', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockAdminContext) => Promise<Response>) => {
        return handler(mockAdminContext);
      }
    );
    const mock = buildSupabaseMock([]);
    (createClient as jest.Mock).mockResolvedValue(mock);

    const res = await GET(makeRequest({ dateFrom: '2026-01-01', dateTo: '2026-12-31' }));
    expect(res.status).toBe(200);

    const lessonsBuilder = mock.from.mock.results[0]?.value;
    if (lessonsBuilder) {
      expect(lessonsBuilder.gte).toHaveBeenCalledWith('scheduled_at', '2026-01-01');
      expect(lessonsBuilder.lte).toHaveBeenCalledWith('scheduled_at', '2026-12-31');
    }
  });

  it('returns 500 on DB error fetching lessons', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockAdminContext) => Promise<Response>) => {
        return handler(mockAdminContext);
      }
    );
    (createClient as jest.Mock).mockResolvedValue(buildSupabaseMock([], { message: 'DB error' }));

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
