import { getLessonDetail } from '../lesson-detail-queries';

const mockWarn = jest.fn();
jest.mock('@/lib/logger', () => ({
  logger: {
    warn: (...args: unknown[]) => mockWarn(...args),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const mockEq = jest.fn();
const mockIs = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: (col: string, val: unknown) => {
            mockEq(col, val);
            return {
              is: (col2: string, val2: unknown) => {
                mockIs(col2, val2);
                return { single: () => mockSingle() };
              },
            };
          },
        }),
      }),
    })
  ),
}));

const baseLesson = {
  id: 'l1',
  scheduled_at: '2026-07-20T10:00:00Z',
  status: 'SCHEDULED',
  title: 'Fingerpicking basics',
  notes: 'Bring the capo',
  teacher_id: 't1',
  student_id: 's1',
};

describe('getLessonDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps a full lesson with joins as arrays and mixed songs', async () => {
    mockSingle.mockResolvedValue({
      data: {
        ...baseLesson,
        lesson_teacher_number: 7,
        duration_minutes: 45,
        format: 'in_person',
        teacher: [{ full_name: 'Sarah' }],
        student: [{ full_name: 'Emma', email: 'emma@x.com' }],
        lesson_songs: [
          {
            song_id: 'sg1',
            status: 'started',
            songs: { title: 'Song A', author: 'AC/DC', key: 'A' },
          },
          { song_id: 'sg2', status: null, songs: [{ title: 'Song B', author: null, key: null }] },
          { song_id: 'sg3', status: 'mastered', songs: null },
          { song_id: 'sg4', status: 'mastered', songs: [] },
        ],
      },
      error: null,
    });

    const detail = await getLessonDetail('l1');

    expect(mockEq).toHaveBeenCalledWith('id', 'l1');
    expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
    expect(detail).toEqual({
      id: 'l1',
      scheduledAt: '2026-07-20T10:00:00Z',
      status: 'SCHEDULED',
      title: 'Fingerpicking basics',
      notes: 'Bring the capo',
      durationMinutes: 45,
      format: 'in_person',
      teacherId: 't1',
      teacherName: 'Sarah',
      studentId: 's1',
      studentName: 'Emma',
      studentEmail: 'emma@x.com',
      lessonTeacherNumber: 7,
      songs: [
        { songId: 'sg1', title: 'Song A', author: 'AC/DC', key: 'A', status: 'started' },
        { songId: 'sg2', title: 'Song B', author: null, key: null, status: null },
      ],
    });
  });

  it('maps a sparse lesson with null joins and no songs', async () => {
    mockSingle.mockResolvedValue({
      data: {
        ...baseLesson,
        title: null,
        notes: null,
        teacher: null,
        student: null,
        lesson_songs: null,
      },
      error: null,
    });

    const detail = await getLessonDetail('l1');

    expect(detail).toEqual({
      id: 'l1',
      scheduledAt: '2026-07-20T10:00:00Z',
      status: 'SCHEDULED',
      title: null,
      notes: null,
      durationMinutes: null,
      format: null,
      teacherId: 't1',
      teacherName: null,
      studentId: 's1',
      studentName: null,
      studentEmail: null,
      lessonTeacherNumber: null,
      songs: [],
    });
  });

  it('returns null without warning for a not-found error (PGRST116)', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'no rows', code: 'PGRST116' } });

    expect(await getLessonDetail('missing')).toBeNull();
    expect(mockWarn).not.toHaveBeenCalled();
  });

  it('warns and returns null for other errors', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'boom', code: '500' } });

    expect(await getLessonDetail('l1')).toBeNull();
    expect(mockWarn).toHaveBeenCalledWith('[lesson-detail-queries] error', {
      error: 'boom',
      code: '500',
    });
  });
});
