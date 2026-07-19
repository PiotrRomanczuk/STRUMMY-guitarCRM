/**
 * generateRecurringLessons (LES-3) — "repeat weekly for N weeks" server action.
 *
 * @see app/dashboard/lessons/recurring-actions.ts
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { generateRecurringLessons } from '../recurring-actions';

const mockGetUserWithRolesSSR = jest.fn();
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: () => mockGetUserWithRolesSSR(),
}));

jest.mock('@/lib/auth/test-account-guard', () => ({
  guardTestAccountMutation: jest.fn().mockReturnValue(null),
}));

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));

const mockSyncLessonCreation = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/services/calendar-lesson-sync', () => ({
  syncLessonCreation: (...args: any[]) => mockSyncLessonCreation(...args),
}));

const mockInsertLessons = jest.fn();
const mockInsertSongs = jest.fn();

function defaultFromImpl(table: string) {
  if (table === 'lessons') {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: [] }),
            }),
          }),
        }),
      }),
      insert: (rows: any[]) => ({
        select: () => mockInsertLessons(rows),
      }),
    };
  }
  if (table === 'lesson_songs') {
    return { insert: (rows: any[]) => mockInsertSongs(rows) };
  }
  throw new Error(`Unexpected table: ${table}`);
}

// jest.clearAllMocks() (below) clears call history but NOT a prior test's
// mockImplementation override — without re-establishing this default every
// test, a test that narrows mockFrom (e.g. to assert lessons-only calls)
// would leak that narrowed behavior into every test after it.
const mockFrom = jest.fn(defaultFromImpl);

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ from: (table: string) => mockFrom(table) })),
}));

const TEACHER_ID = '123e4567-e89b-12d3-a456-426614174000';
const STUDENT_ID = '223e4567-e89b-12d3-a456-426614174001';

function asTeacher() {
  mockGetUserWithRolesSSR.mockResolvedValue({
    user: { id: TEACHER_ID },
    isAdmin: false,
    isTeacher: true,
    isDevelopment: false,
  });
}

function insertedRows(count: number, startIso = '2026-08-03T15:00:00.000Z') {
  const start = new Date(startIso);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    return {
      id: `lesson-${i + 1}`,
      scheduled_at: d.toISOString(),
      title: null,
      teacher_id: TEACHER_ID,
      student_id: STUDENT_ID,
      status: 'SCHEDULED',
    };
  });
}

describe('generateRecurringLessons (LES-3)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockImplementation(defaultFromImpl);
  });

  it('rejects unauthenticated callers', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({ user: null });
    const result = await generateRecurringLessons({
      studentId: STUDENT_ID,
      dayOfWeek: 1,
      time: '15:00',
      weeks: 4,
    });
    expect(result).toEqual({ error: 'Unauthorized' });
  });

  it('rejects students', async () => {
    mockGetUserWithRolesSSR.mockResolvedValue({
      user: { id: STUDENT_ID },
      isAdmin: false,
      isTeacher: false,
      isDevelopment: false,
    });
    const result = await generateRecurringLessons({
      studentId: STUDENT_ID,
      dayOfWeek: 1,
      time: '15:00',
      weeks: 4,
    });
    expect(result).toEqual({ error: 'Only admins and teachers can create lessons' });
  });

  it('rejects invalid input (weeks out of range)', async () => {
    asTeacher();
    const result = await generateRecurringLessons({
      studentId: STUDENT_ID,
      dayOfWeek: 1,
      time: '15:00',
      weeks: 0,
    });
    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toContain('Validation error');
  });

  it('creates 4 lessons with correct dates and sequential numbers, and syncs each to Google Calendar', async () => {
    asTeacher();
    const rows = insertedRows(4);
    mockInsertLessons.mockResolvedValue({ data: rows, error: null });

    const result = await generateRecurringLessons({
      studentId: STUDENT_ID,
      dayOfWeek: 1,
      time: '15:00',
      weeks: 4,
      startDate: '2026-08-03T15:00:00.000Z',
    });

    expect(result).not.toHaveProperty('error');
    const ok = result as { created: number; lessons: { id: string; scheduled_at: string }[] };
    expect(ok.created).toBe(4);
    expect(ok.lessons).toHaveLength(4);

    // 4 distinct dates, each exactly 7 days apart, starting from the given startDate.
    const times = ok.lessons.map((l) => new Date(l.scheduled_at).getTime());
    expect(new Set(times).size).toBe(4);
    for (let i = 1; i < times.length; i++) {
      expect(times[i] - times[i - 1]).toBe(7 * 24 * 60 * 60 * 1000);
    }

    // The insert call itself received sequential lesson_teacher_number values.
    const insertedCallRows = mockInsertLessons.mock.calls[0][0] as {
      lesson_teacher_number: number;
    }[];
    expect(insertedCallRows.map((r) => r.lesson_teacher_number)).toEqual([1, 2, 3, 4]);

    // Google Calendar sync attempted once per created lesson.
    expect(mockSyncLessonCreation).toHaveBeenCalledTimes(4);
    for (const lesson of rows) {
      expect(mockSyncLessonCreation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ id: lesson.id, teacher_id: TEACHER_ID, student_id: STUDENT_ID })
      );
    }
  });

  it("continues numbering from the teacher-student pair's existing lesson count", async () => {
    asTeacher();
    mockFrom.mockImplementation((table: string) => {
      if (table === 'lessons') {
        let selectCalls = 0;
        return {
          select: () => {
            selectCalls++;
            if (selectCalls === 1) {
              return {
                eq: () => ({
                  eq: () => ({
                    order: () => ({
                      limit: () => Promise.resolve({ data: [{ lesson_teacher_number: 10 }] }),
                    }),
                  }),
                }),
              };
            }
            throw new Error('unexpected extra select on lessons');
          },
          insert: (rows: any[]) => ({ select: () => mockInsertLessons(rows) }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });
    mockInsertLessons.mockResolvedValue({ data: insertedRows(2), error: null });

    await generateRecurringLessons({
      studentId: STUDENT_ID,
      dayOfWeek: 1,
      time: '15:00',
      weeks: 2,
    });

    const insertedCallRows = mockInsertLessons.mock.calls[0][0] as {
      lesson_teacher_number: number;
    }[];
    expect(insertedCallRows.map((r) => r.lesson_teacher_number)).toEqual([11, 12]);
  });

  it('links provided songs to every created lesson', async () => {
    asTeacher();
    const rows = insertedRows(2);
    mockInsertLessons.mockResolvedValue({ data: rows, error: null });
    mockInsertSongs.mockResolvedValue({ data: null, error: null });

    await generateRecurringLessons({
      studentId: STUDENT_ID,
      dayOfWeek: 1,
      time: '15:00',
      weeks: 2,
      songIds: ['323e4567-e89b-12d3-a456-426614174002', '423e4567-e89b-12d3-a456-426614174003'],
    });

    expect(mockInsertSongs).toHaveBeenCalledTimes(1);
    const songRows = mockInsertSongs.mock.calls[0][0] as { lesson_id: string; song_id: string }[];
    expect(songRows).toHaveLength(4); // 2 lessons x 2 songs
  });

  it('surfaces a DB insert error without throwing', async () => {
    asTeacher();
    mockInsertLessons.mockResolvedValue({ data: null, error: { message: 'insert failed' } });

    const result = await generateRecurringLessons({
      studentId: STUDENT_ID,
      dayOfWeek: 1,
      time: '15:00',
      weeks: 4,
    });

    expect(result).toEqual({ error: 'insert failed' });
    expect(mockSyncLessonCreation).not.toHaveBeenCalled();
  });

  it('unchecked/single-lesson behavior is untouched: weeks=1 yields exactly one lesson', async () => {
    asTeacher();
    mockInsertLessons.mockResolvedValue({ data: insertedRows(1), error: null });

    const result = await generateRecurringLessons({
      studentId: STUDENT_ID,
      dayOfWeek: 1,
      time: '15:00',
      weeks: 1,
    });

    expect((result as { created: number }).created).toBe(1);
  });
});
