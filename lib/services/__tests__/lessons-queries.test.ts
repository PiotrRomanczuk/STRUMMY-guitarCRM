import {
  getRecentLessons,
  lessonStatusLabel,
  lessonStatusColour,
  songStatusColour,
  summariseLessons,
  type LessonRow,
  type LessonViewer,
} from '../lessons-queries';

const TEACHER_VIEWER: LessonViewer = { isAdmin: false, isTeacher: true, isStudent: false };
const STUDENT_VIEWER: LessonViewer = { isAdmin: false, isTeacher: false, isStudent: true };

const mockWarn = jest.fn();
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: (...args: unknown[]) => mockWarn(...args),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

type Chain = {
  select: () => Chain;
  eq: (col: string, val: unknown) => Chain;
  is: (col: string, val: unknown) => Chain;
  order: (col: string, opts: unknown) => Chain;
  in: (col: string, vals: unknown) => Chain;
  gte: (col: string, val: unknown) => Chain;
  lt: (col: string, val: unknown) => Chain;
  limit: (n: number) => unknown;
};

const mockEq = jest.fn();
const mockIs = jest.fn();
const mockOrder = jest.fn();
const mockIn = jest.fn();
const mockGte = jest.fn();
const mockLt = jest.fn();
const mockLimit = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: () => {
        const chain: Chain = {
          select: () => chain,
          eq: (col, val) => {
            mockEq(col, val);
            return chain;
          },
          is: (col, val) => {
            mockIs(col, val);
            return chain;
          },
          order: (col, opts) => {
            mockOrder(col, opts);
            return chain;
          },
          in: (col, vals) => {
            mockIn(col, vals);
            return chain;
          },
          gte: (col, val) => {
            mockGte(col, val);
            return chain;
          },
          lt: (col, val) => {
            mockLt(col, val);
            return chain;
          },
          limit: (n) => mockLimit(n),
        };
        return chain;
      },
    })
  ),
}));

const baseRow = {
  id: 'l1',
  lesson_teacher_number: 7,
  scheduled_at: '2026-07-20T10:00:00Z',
  status: 'SCHEDULED',
  title: 'Intro lesson',
  teacher_id: 't1',
  student_id: 's1',
  lesson_songs: [{ status: 'started' }, { status: 'mastered' }],
};

describe('getRecentLessons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps rows for a teacher with default filters (student as object)', async () => {
    mockLimit.mockResolvedValue({
      data: [
        { ...baseRow, student: { id: 's1', full_name: 'Emma', email: 'emma@x.com' } },
        { ...baseRow, id: 'l2', title: null, student: null },
      ],
      error: null,
    });

    const rows = await getRecentLessons('t1', TEACHER_VIEWER);

    expect(mockEq).toHaveBeenCalledWith('teacher_id', 't1');
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    expect(mockOrder).toHaveBeenCalledWith('scheduled_at', { ascending: false });
    expect(mockIn).not.toHaveBeenCalled();
    expect(mockLimit).toHaveBeenCalledWith(60);
    expect(mockGte).not.toHaveBeenCalled();
    expect(mockLt).not.toHaveBeenCalled();
    expect(rows).toEqual([
      {
        id: 'l1',
        lessonNumber: 7,
        scheduledAt: '2026-07-20T10:00:00Z',
        status: 'SCHEDULED',
        title: 'Intro lesson',
        teacherId: 't1',
        studentId: 's1',
        studentName: 'Emma',
        studentEmail: 'emma@x.com',
        teacherName: null,
        teacherEmail: null,
        songCount: 2,
        songStatuses: ['started', 'mastered'],
      },
      {
        id: 'l2',
        lessonNumber: 7,
        scheduledAt: '2026-07-20T10:00:00Z',
        status: 'SCHEDULED',
        title: null,
        teacherId: 't1',
        studentId: 's1',
        studentName: null,
        studentEmail: null,
        teacherName: null,
        teacherEmail: null,
        songCount: 2,
        songStatuses: ['started', 'mastered'],
      },
    ]);
  });

  it('aggregates song count/statuses and defaults number + songs when columns are absent', async () => {
    mockLimit.mockResolvedValue({
      data: [
        {
          id: 'l9',
          scheduled_at: '2026-07-20T10:00:00Z',
          status: 'SCHEDULED',
          title: 'Bare row',
          teacher_id: 't1',
          student_id: 's1',
          // no lesson_teacher_number, no lesson_songs, no joined profiles
        },
      ],
      error: null,
    });

    const rows = await getRecentLessons('t1', TEACHER_VIEWER);

    expect(rows[0].lessonNumber).toBe(0);
    expect(rows[0].songCount).toBe(0);
    expect(rows[0].songStatuses).toEqual([]);
  });

  it('applies a year range filter as gte/lt UTC boundaries', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    await getRecentLessons('t1', TEACHER_VIEWER, { year: 2025 });

    expect(mockGte).toHaveBeenCalledWith('scheduled_at', '2025-01-01T00:00:00.000Z');
    expect(mockLt).toHaveBeenCalledWith('scheduled_at', '2026-01-01T00:00:00.000Z');
  });

  it('filters by student, oldest sort, and statuses (student as array)', async () => {
    mockLimit.mockResolvedValue({
      data: [
        { ...baseRow, student: [{ id: 's1', full_name: 'Liam', email: 'liam@x.com' }] },
        { ...baseRow, id: 'l3', student: [] },
      ],
      error: null,
    });

    const rows = await getRecentLessons(
      's1',
      STUDENT_VIEWER,
      { statuses: ['SCHEDULED', 'COMPLETED'], sort: 'oldest' },
      10
    );

    expect(mockEq).toHaveBeenCalledWith('student_id', 's1');
    expect(mockOrder).toHaveBeenCalledWith('scheduled_at', { ascending: true });
    expect(mockIn).toHaveBeenCalledWith('status', ['SCHEDULED', 'COMPLETED']);
    expect(mockLimit).toHaveBeenCalledWith(10);
    expect(rows[0].studentName).toBe('Liam');
    expect(rows[1].studentName).toBeNull();
    expect(rows[1].studentEmail).toBeNull();
  });

  it('does not apply the status filter for an empty statuses array', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const rows = await getRecentLessons('t1', TEACHER_VIEWER, { statuses: [] });

    expect(mockIn).not.toHaveBeenCalled();
    expect(rows).toEqual([]);
  });

  it('warns and returns [] on query error', async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: 'boom', code: '42' } });

    const rows = await getRecentLessons('t1', TEACHER_VIEWER);

    expect(mockWarn).toHaveBeenCalledWith('[lessons-queries] recent lessons error', {
      error: 'boom',
      code: '42',
    });
    expect(rows).toEqual([]);
  });

  it('returns [] when data is null without error', async () => {
    mockLimit.mockResolvedValue({ data: null, error: null });

    const rows = await getRecentLessons('t1', TEACHER_VIEWER);

    expect(mockWarn).not.toHaveBeenCalled();
    expect(rows).toEqual([]);
  });
});

describe('lessonStatusLabel', () => {
  it('maps known statuses (both cases)', () => {
    expect(lessonStatusLabel('SCHEDULED')).toBe('Scheduled');
    expect(lessonStatusLabel('in_progress')).toBe('In progress');
  });

  it('falls back to the raw status for unknown values', () => {
    expect(lessonStatusLabel('MYSTERY')).toBe('MYSTERY');
  });
});

describe('lessonStatusColour', () => {
  it('maps known statuses (both cases)', () => {
    expect(lessonStatusColour('COMPLETED')).toBe('var(--success)');
    expect(lessonStatusColour('cancelled')).toBe('var(--ink-4)');
  });

  it('falls back to the muted colour for unknown values', () => {
    expect(lessonStatusColour('MYSTERY')).toBe('var(--ink-4)');
  });
});

describe('songStatusColour', () => {
  it('maps each lesson_songs.status to its editorial token', () => {
    expect(songStatusColour('to_learn')).toBe('var(--ink-4)');
    expect(songStatusColour('started')).toBe('var(--info)');
    expect(songStatusColour('remembered')).toBe('var(--warn)');
    expect(songStatusColour('with_author')).toBe('#7a6aa0');
    expect(songStatusColour('mastered')).toBe('var(--success)');
  });

  it('falls back to the muted colour for unknown values', () => {
    expect(songStatusColour('???')).toBe('var(--ink-4)');
  });
});

describe('summariseLessons', () => {
  const makeLesson = (id: string, status: string): LessonRow => ({
    id,
    lessonNumber: 1,
    scheduledAt: '2026-07-20T10:00:00Z',
    status,
    title: null,
    teacherId: 't1',
    studentId: 's1',
    studentName: null,
    studentEmail: null,
    teacherName: null,
    teacherEmail: null,
    songCount: 0,
    songStatuses: [],
  });

  it('returns zero totals for an empty list', () => {
    expect(summariseLessons([])).toEqual({ total: 0, byStatus: {} });
  });

  it('counts statuses case-insensitively, including repeats', () => {
    const result = summariseLessons([
      makeLesson('l1', 'SCHEDULED'),
      makeLesson('l2', 'scheduled'),
      makeLesson('l3', 'COMPLETED'),
    ]);
    expect(result).toEqual({ total: 3, byStatus: { scheduled: 2, completed: 1 } });
  });
});
