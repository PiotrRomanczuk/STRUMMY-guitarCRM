/**
 * @jest-environment node
 *
 * Unit tests for GET /api/lessons/stats/advanced
 */

import { GET } from '@/app/api/lessons/stats/advanced/route';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { NextResponse } from 'next/server';

jest.mock('@/lib/supabase/admin', () => ({ createAdminClient: jest.fn() }));
jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const STUDENT_ID = 'ca2e70e7-7876-4519-ac60-be785646d096';

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
  return new Request('http://localhost/api/lessons/stats/advanced');
}

interface LessonRow {
  id: string;
  student_id: string;
  status: string;
  scheduled_at: string;
}

function buildAdminClientMock(
  lessons: LessonRow[],
  lessonsError: { message: string } | null = null
) {
  const profilesBuilder = {
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockResolvedValue({ data: [], error: null }),
  };

  const lessonsBuilder = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: lessons, error: lessonsError }),
  };

  return {
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'profiles') return profilesBuilder;
      return lessonsBuilder;
    }),
  };
}

describe('GET /api/lessons/stats/advanced', () => {
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

  it('teacher role is allowed through', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockTeacherContext) => Promise<Response>) =>
        handler(mockTeacherContext)
    );
    (createAdminClient as jest.Mock).mockReturnValue(buildAdminClientMock([]));

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });

  it('admin role returns analytics object with expected shape', async () => {
    const lessons: LessonRow[] = [
      {
        id: 'l1',
        student_id: STUDENT_ID,
        status: 'COMPLETED',
        scheduled_at: '2026-01-10T10:00:00Z',
      },
      {
        id: 'l2',
        student_id: STUDENT_ID,
        status: 'CANCELLED',
        scheduled_at: '2026-02-15T10:00:00Z',
      },
      {
        id: 'l3',
        student_id: STUDENT_ID,
        status: 'SCHEDULED',
        scheduled_at: '2026-03-20T10:00:00Z',
      },
    ];
    (createAdminClient as jest.Mock).mockReturnValue(buildAdminClientMock(lessons));

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('overview');
    expect(body.overview).toHaveProperty('totalLessons', 3);
    expect(body.overview).toHaveProperty('uniqueStudents', 1);
    expect(body.overview).toHaveProperty('completionRate');
    expect(body.overview).toHaveProperty('cancellationRate');
    expect(body).toHaveProperty('monthlyTrend');
    expect(body).toHaveProperty('studentLeaderboard');
    expect(body).toHaveProperty('scheduleDistribution');
    expect(body).toHaveProperty('studentGrowth');
    expect(body).toHaveProperty('retention');
  });

  it('returns correct completionRate and cancellationRate', async () => {
    const lessons: LessonRow[] = [
      {
        id: 'l1',
        student_id: STUDENT_ID,
        status: 'COMPLETED',
        scheduled_at: '2026-01-10T10:00:00Z',
      },
      {
        id: 'l2',
        student_id: STUDENT_ID,
        status: 'COMPLETED',
        scheduled_at: '2026-02-10T10:00:00Z',
      },
      {
        id: 'l3',
        student_id: STUDENT_ID,
        status: 'CANCELLED',
        scheduled_at: '2026-03-10T10:00:00Z',
      },
      {
        id: 'l4',
        student_id: STUDENT_ID,
        status: 'SCHEDULED',
        scheduled_at: '2026-04-10T10:00:00Z',
      },
    ];
    (createAdminClient as jest.Mock).mockReturnValue(buildAdminClientMock(lessons));

    const res = await GET(makeRequest());
    const body = await res.json();

    // 2 completed out of 4 = 50%
    expect(body.overview.completionRate).toBe(50);
    // 1 cancelled out of 4 = 25%
    expect(body.overview.cancellationRate).toBe(25);
  });

  it('DB error returns 500', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      buildAdminClientMock([], { message: 'db error' })
    );

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });

  it('empty lessons array returns zero counts and 0% rates', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(buildAdminClientMock([]));

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.overview.totalLessons).toBe(0);
    expect(body.overview.uniqueStudents).toBe(0);
    expect(body.overview.completionRate).toBe(0);
    expect(body.overview.cancellationRate).toBe(0);
  });
});
