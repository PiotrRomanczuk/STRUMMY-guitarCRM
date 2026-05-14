// @jest-environment node

import { GET as getAssignments } from '@/app/api/song/[id]/assignments/route';
import { GET as getLessons } from '@/app/api/song/[id]/lessons/route';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth/withApiAuth', () => ({ withApiAuth: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }),
}));

const SONG_ID = 'a1b2c3d4-1111-4000-8000-000000000010';

const adminCtx = {
  user: { id: 'a1b2c3d4-0000-4000-8000-000000000001' },
  roles: { isAdmin: true, isTeacher: false, isStudent: false },
  flags: { isDevelopment: false },
};

function makeRequest(songId: string): [NextRequest, { params: Promise<{ id: string }> }] {
  return [
    new NextRequest(`http://localhost/api/song/${songId}/assignments`),
    { params: Promise.resolve({ id: songId }) },
  ];
}

beforeEach(() => {
  jest.clearAllMocks();
  (withApiAuth as jest.Mock).mockImplementation(
    async (_req: unknown, handler: (ctx: typeof adminCtx) => unknown) => handler(adminCtx)
  );
});

// ── Assignments ───────────────────────────────────────────────────────────────

describe('GET /api/song/[id]/assignments', () => {
  function buildAssignmentsClient(overrides: {
    assignments?: unknown[];
    error?: { message: string } | null;
  }) {
    const result = {
      data: overrides.assignments ?? [],
      error: overrides.error ?? null,
    };
    const order = jest.fn().mockResolvedValue(result);
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ select });
    return { from };
  }

  it('returns assignments array with joined data', async () => {
    const assignments = [{ id: 'asgn-1', title: 'Practice C', status: 'pending' }];
    (createClient as jest.Mock).mockResolvedValue(buildAssignmentsClient({ assignments }));
    const [req, ctx] = makeRequest(SONG_ID);
    const res = await getAssignments(req, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.assignments).toEqual(assignments);
  });

  it('filters by song_id via nested eq', async () => {
    const client = buildAssignmentsClient({ assignments: [] });
    (createClient as jest.Mock).mockResolvedValue(client);
    const [req, ctx] = makeRequest(SONG_ID);
    await getAssignments(req, ctx);
    const eqCalls = (client.from('assignments').select({} as never).eq as jest.Mock).mock.calls;
    expect(eqCalls[0]).toEqual(['lesson.lesson_songs.song_id', SONG_ID]);
  });

  it('returns 500 on DB error', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildAssignmentsClient({ error: { message: 'connection failed' } })
    );
    const [req, ctx] = makeRequest(SONG_ID);
    const res = await getAssignments(req, ctx);
    expect(res.status).toBe(500);
  });

  it('returns empty assignments array when none exist', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildAssignmentsClient({ assignments: [] }));
    const [req, ctx] = makeRequest(SONG_ID);
    const res = await getAssignments(req, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.assignments).toEqual([]);
  });
});

// ── Lessons ───────────────────────────────────────────────────────────────────

describe('GET /api/song/[id]/lessons', () => {
  function buildLessonsClient(overrides: {
    lessonSongs?: Array<{ id: string; status: string; lessons: unknown }>;
    error?: { message: string } | null;
  }) {
    const result = {
      data: overrides.lessonSongs ?? [],
      error: overrides.error ?? null,
    };
    const order = jest.fn().mockResolvedValue(result);
    const eq = jest.fn().mockReturnValue({ order });
    const select = jest.fn().mockReturnValue({ eq });
    const from = jest.fn().mockReturnValue({ select });
    return { from };
  }

  const lessonObj = {
    id: 'lesson-1',
    lesson_teacher_number: 5,
    scheduled_at: '2024-01-10T10:00:00Z',
    status: 'completed',
    student_id: 'student-1',
    teacher_id: 'teacher-1',
    student: { id: 'student-1', full_name: 'Emma', email: 'emma@test.com' },
    teacher: { id: 'teacher-1', full_name: 'Sarah', email: 'sarah@test.com' },
  };

  it('returns transformed lessons list', async () => {
    const lessonSongs = [{ id: 'ls-1', status: 'learning', lessons: lessonObj }];
    (createClient as jest.Mock).mockResolvedValue(buildLessonsClient({ lessonSongs }));
    const [req, ctx] = makeRequest(SONG_ID);
    const res = await getLessons(req, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lessons).toHaveLength(1);
    expect(body.lessons[0].id).toBe('lesson-1');
    expect(body.lessons[0].song_status).toBe('learning');
  });

  it('filters out null lessons from transform', async () => {
    const lessonSongs = [
      { id: 'ls-1', status: 'learning', lessons: lessonObj },
      { id: 'ls-2', status: 'done', lessons: null },
    ];
    (createClient as jest.Mock).mockResolvedValue(buildLessonsClient({ lessonSongs }));
    const [req, ctx] = makeRequest(SONG_ID);
    const res = await getLessons(req, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lessons).toHaveLength(1);
  });

  it('returns 500 on DB error', async () => {
    (createClient as jest.Mock).mockResolvedValue(
      buildLessonsClient({ error: { message: 'db error' } })
    );
    const [req, ctx] = makeRequest(SONG_ID);
    const res = await getLessons(req, ctx);
    expect(res.status).toBe(500);
  });

  it('returns empty array when no lesson_songs', async () => {
    (createClient as jest.Mock).mockResolvedValue(buildLessonsClient({ lessonSongs: [] }));
    const [req, ctx] = makeRequest(SONG_ID);
    const res = await getLessons(req, ctx);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.lessons).toEqual([]);
  });
});
