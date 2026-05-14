/**
 * @jest-environment node
 *
 * Unit tests for GET + POST /api/lessons/songs
 */

import { GET, POST } from '@/app/api/lessons/songs/route';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

const LESSON_ID = '776dfd64-c31a-45dc-b32b-a365f3ebd4b9';
const SONG_ID = 'a7c2363e-1571-484d-a9fd-c625c4f82537';

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

function makeGetRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/lessons/songs');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString());
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/lessons/songs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Simpler chainable builder
function buildChainMock(finalResult: { data: unknown; error: unknown }) {
  const builder: Record<string, jest.Mock> & { then?: unknown } = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(finalResult),
    insert: jest.fn().mockReturnThis(),
  };
  return builder;
}

describe('GET /api/lessons/songs', () => {
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

  it('missing lessonId returns 400', async () => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    (createClient as jest.Mock).mockResolvedValue({ from: jest.fn().mockReturnValue(builder) });

    const res = await GET(makeGetRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Lesson ID is required');
  });

  it('returns lessonSongs array for valid lessonId', async () => {
    const rows = [{ id: 'ls-1', lesson_id: LESSON_ID, song_id: SONG_ID }];
    // Build a chainable that resolves when awaited
    const builder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    // Make the whole builder a thenable
    const thenable = Object.assign(builder, {
      then: (res: (v: { data: typeof rows; error: null }) => void) =>
        Promise.resolve({ data: rows, error: null }).then(res),
    });
    (createClient as jest.Mock).mockResolvedValue({ from: jest.fn().mockReturnValue(thenable) });

    const res = await GET(makeGetRequest({ lessonId: LESSON_ID }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.lessonSongs)).toBe(true);
  });

  it('returns 500 on DB error', async () => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: (res: (v: { data: null; error: { message: string } }) => void) =>
        Promise.resolve({ data: null, error: { message: 'DB error' } }).then(res),
    };
    (createClient as jest.Mock).mockResolvedValue({ from: jest.fn().mockReturnValue(builder) });

    const res = await GET(makeGetRequest({ lessonId: LESSON_ID }));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/lessons/songs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockTeacherContext) => Promise<Response>) =>
        handler(mockTeacherContext)
    );
  });

  it('student context returns 403', async () => {
    (withApiAuth as jest.Mock).mockImplementation(
      async (_req: unknown, handler: (ctx: typeof mockStudentContext) => Promise<Response>) =>
        handler(mockStudentContext)
    );
    (createClient as jest.Mock).mockResolvedValue({ from: jest.fn() });

    const res = await POST(makePostRequest({ lesson_id: LESSON_ID, song_id: SONG_ID }));
    expect(res.status).toBe(403);
  });

  it('missing lesson_id returns 400 validation error', async () => {
    const builder = buildChainMock({ data: null, error: null });
    (createClient as jest.Mock).mockResolvedValue({ from: jest.fn().mockReturnValue(builder) });

    const res = await POST(makePostRequest({ song_id: SONG_ID }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid lesson song data');
  });

  it('missing song_id returns 400 validation error', async () => {
    const builder = buildChainMock({ data: null, error: null });
    (createClient as jest.Mock).mockResolvedValue({ from: jest.fn().mockReturnValue(builder) });

    const res = await POST(makePostRequest({ lesson_id: LESSON_ID }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid lesson song data');
  });

  it('valid payload inserts lesson-song record', async () => {
    const lessonRow = { id: LESSON_ID };
    const songRow = { id: SONG_ID };
    const insertedRow = { id: 'ls-new', lesson_id: LESSON_ID, song_id: SONG_ID };

    let callCount = 0;
    const from = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // lessons .select().eq().single() -> lesson found
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: lessonRow, error: null }),
        };
      }
      if (callCount === 2) {
        // songs .select().eq().single() -> song found
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: songRow, error: null }),
        };
      }
      if (callCount === 3) {
        // existing assignment check -> null (no duplicate)
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      // insert
      return {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: insertedRow, error: null }),
      };
    });

    (createClient as jest.Mock).mockResolvedValue({ from });

    const res = await POST(makePostRequest({ lesson_id: LESSON_ID, song_id: SONG_ID }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe('ls-new');
  });

  it('DB error on insert returns 500', async () => {
    let callCount = 0;
    const from = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: LESSON_ID }, error: null }),
        };
      }
      if (callCount === 2) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: SONG_ID }, error: null }),
        };
      }
      if (callCount === 3) {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'insert error' } }),
      };
    });

    (createClient as jest.Mock).mockResolvedValue({ from });

    const res = await POST(makePostRequest({ lesson_id: LESSON_ID, song_id: SONG_ID }));
    expect(res.status).toBe(500);
  });
});
