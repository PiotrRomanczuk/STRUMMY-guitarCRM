/**
 * @jest-environment node
 *
 * Unit tests for GET + POST /api/lessons/schedule
 */

import { GET, POST } from '@/app/api/lessons/schedule/route';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const TEACHER_ID = '6225d9a5-fb1b-4beb-bf43-1c9a15ab42d0';

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
  const url = new URL('http://localhost/api/lessons/schedule');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/lessons/schedule', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Build a thenable query builder that resolves to {data, error} at any point in the chain. */
function makeThenableBuilder<T>(result: { data: T; error: { message: string } | null }) {
  const builder: Record<string, jest.Mock> & {
    then: (
      resolve: (v: typeof result) => void,
      reject?: (e: unknown) => void
    ) => Promise<typeof result>;
  } = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

/** Mock for GET /api/lessons/schedule — two thenable builders keyed by table. */
function buildGetMock(opts: {
  availabilityData?: unknown[];
  availabilityError?: { message: string } | null;
  lessonsData?: unknown[];
  lessonsError?: { message: string } | null;
}) {
  const {
    availabilityData = [],
    availabilityError = null,
    lessonsData = [],
    lessonsError = null,
  } = opts;

  const availBuilder = makeThenableBuilder({ data: availabilityData, error: availabilityError });
  const lessonsBuilder = makeThenableBuilder({ data: lessonsData, error: lessonsError });

  return {
    from: jest
      .fn()
      .mockImplementation((table: string) =>
        table === 'teacher_availability' ? availBuilder : lessonsBuilder
      ),
  };
}

/** Mock for POST /api/lessons/schedule — conflict check then insert, both on teacher_availability. */
function buildPostMock(opts: {
  conflictData?: unknown[];
  conflictError?: { message: string } | null;
  insertData?: unknown;
  insertError?: { message: string } | null;
}) {
  const {
    conflictData = [],
    conflictError = null,
    insertData = { id: 'new-avail' },
    insertError = null,
  } = opts;

  // Conflict check: .select('id').eq(...).eq(...) — resolves on second eq
  const conflictBuilder = { select: jest.fn().mockReturnThis(), eq: jest.fn() };
  let eqCount = 0;
  conflictBuilder.eq.mockImplementation(() => {
    eqCount++;
    if (eqCount >= 2) return Promise.resolve({ data: conflictData, error: conflictError });
    return conflictBuilder;
  });

  // Insert
  const insertBuilder = {
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: insertData, error: insertError }),
  };

  let callIndex = 0;
  return {
    from: jest.fn().mockImplementation(() => {
      callIndex++;
      if (callIndex === 1) {
        eqCount = 0;
        return conflictBuilder;
      }
      return insertBuilder;
    }),
  };
}

describe('GET /api/lessons/schedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockAdminContext) => Promise<Response>) =>
        handler(mockAdminContext)
    );
  });

  it('returns 400 when teacherId is missing', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildGetMock({}));

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Teacher ID is required');
  });

  it('returns availability and scheduled lessons for valid teacherId', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildGetMock({
        availabilityData: [{ id: 'av-1', teacher_id: TEACHER_ID, date: '2026-06-01' }],
        lessonsData: [{ id: 'lesson-1', teacher_id: TEACHER_ID }],
      })
    );

    const res = await GET(makeGetRequest({ teacherId: TEACHER_ID }));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.teacherId).toBe(TEACHER_ID);
    expect(Array.isArray(body.availability)).toBe(true);
    expect(Array.isArray(body.scheduledLessons)).toBe(true);
  });

  it('returns 500 when lessons DB query fails', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildGetMock({ lessonsError: { message: 'DB error' } })
    );

    const res = await GET(makeGetRequest({ teacherId: TEACHER_ID }));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/lessons/schedule', () => {
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
    (createClient as jest.Mock).mockResolvedValue(buildGetMock({}));

    const res = await POST(makePostRequest({}));
    expect(res.status).toBe(403);
  });

  it('missing required fields returns 400 validation error', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildGetMock({}));

    const res = await POST(makePostRequest({ teacher_id: TEACHER_ID }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('invalid UUID for teacher_id returns 400', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildGetMock({}));

    const res = await POST(
      makePostRequest({
        teacher_id: 'not-a-uuid',
        date: '2026-06-01',
        start_time: '10:00',
        end_time: '11:00',
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('invalid date format returns 400', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildGetMock({}));

    const res = await POST(
      makePostRequest({
        teacher_id: TEACHER_ID,
        date: '01-06-2026',
        start_time: '10:00',
        end_time: '11:00',
      })
    );
    expect(res.status).toBe(400);
  });

  it('valid payload inserts into teacher_availability', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildPostMock({ insertData: { id: 'av-new', teacher_id: TEACHER_ID } })
    );

    const res = await POST(
      makePostRequest({
        teacher_id: TEACHER_ID,
        date: '2026-06-01',
        start_time: '10:00',
        end_time: '11:00',
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('av-new');
  });

  it('DB error on insert returns 500', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildPostMock({ insertError: { message: 'insert failed' } })
    );

    const res = await POST(
      makePostRequest({
        teacher_id: TEACHER_ID,
        date: '2026-06-01',
        start_time: '10:00',
        end_time: '11:00',
      })
    );
    expect(res.status).toBe(500);
  });
});
