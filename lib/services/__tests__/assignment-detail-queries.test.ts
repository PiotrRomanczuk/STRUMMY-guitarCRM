import { getAssignmentDetail, getAssignmentHistory } from '../assignment-detail-queries';
import { logger } from '@/lib/logger';

const mockSingle = jest.fn();
const mockLimit = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: () => ({
        select: () => ({
          eq: () => ({
            is: () => ({
              single: () => mockSingle(),
            }),
            order: () => ({
              limit: () => mockLimit(),
            }),
          }),
        }),
      }),
    })
  ),
}));

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

describe('getAssignmentDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps a full row with embedded objects correctly', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'a1',
        title: 'Learn C Major',
        description: 'Practice the scale',
        status: 'in_progress',
        due_date: '2026-07-20T00:00:00Z',
        teacher_id: 't1',
        student_id: 's1',
        checklist: [{ id: '1', text: 'Play C', done: true }],
        created_at: '2026-07-10T00:00:00Z',
        updated_at: '2026-07-15T00:00:00Z',
        student: { full_name: 'Student Bob', email: 'bob@example.com' },
        teacher: { full_name: 'Teacher Alice' },
        song: { id: 'song1', title: 'C Major Scale', author: 'Trad' },
        lesson: { id: 'lesson1', scheduled_at: '2026-07-19T00:00:00Z' },
      },
      error: null,
    });

    const result = await getAssignmentDetail('a1');
    expect(result).toEqual({
      id: 'a1',
      title: 'Learn C Major',
      description: 'Practice the scale',
      status: 'in_progress',
      dueDate: '2026-07-20T00:00:00Z',
      teacherId: 't1',
      studentId: 's1',
      studentName: 'Student Bob',
      studentEmail: 'bob@example.com',
      teacherName: 'Teacher Alice',
      song: { id: 'song1', title: 'C Major Scale', author: 'Trad' },
      lesson: { id: 'lesson1', scheduledAt: '2026-07-19T00:00:00Z' },
      checklist: [{ id: '1', text: 'Play C', done: true }],
      createdAt: '2026-07-10T00:00:00Z',
      updatedAt: '2026-07-15T00:00:00Z',
    });
  });

  it('handles array embeddings (PostgREST idiosyncrasy)', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'a2',
        title: 'Test',
        description: null,
        status: 'todo',
        due_date: null,
        teacher_id: 't1',
        student_id: 's1',
        checklist: null,
        created_at: '2026-07-10T00:00:00Z',
        updated_at: '2026-07-10T00:00:00Z',
        student: [{ full_name: 'Student Bob', email: null }],
        teacher: [{ full_name: null }],
        song: [],
        lesson: null,
      },
      error: null,
    });

    const result = await getAssignmentDetail('a2');
    expect(result?.studentName).toBe('Student Bob');
    expect(result?.teacherName).toBeNull();
    expect(result?.song).toBeNull();
    expect(result?.lesson).toBeNull();
    expect(result?.checklist).toEqual([]);
  });

  it('nulls out a missing student and unset song author / lesson schedule', async () => {
    mockSingle.mockResolvedValue({
      data: {
        id: 'a3',
        title: 'Test',
        description: null,
        status: 'todo',
        due_date: null,
        teacher_id: 't1',
        student_id: 's1',
        checklist: null,
        created_at: '2026-07-10T00:00:00Z',
        updated_at: '2026-07-10T00:00:00Z',
        student: null,
        teacher: { full_name: 'Teacher Alice' },
        song: { id: 'song1', title: 'Untitled Riff', author: null },
        lesson: { id: 'lesson1', scheduled_at: null },
      },
      error: null,
    });

    const result = await getAssignmentDetail('a3');
    expect(result?.studentName).toBeNull();
    expect(result?.studentEmail).toBeNull();
    expect(result?.song).toEqual({ id: 'song1', title: 'Untitled Riff', author: null });
    expect(result?.lesson).toEqual({ id: 'lesson1', scheduledAt: null });
  });

  it('returns null on error and logs if not PGRST116', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'boom' } });
    expect(await getAssignmentDetail('a1')).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith('[assignment-detail-queries] error', {
      error: 'boom',
      code: 'OTHER',
    });
  });

  it('returns null silently on PGRST116 (not found)', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'not found' } });
    expect(await getAssignmentDetail('a1')).toBeNull();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});

describe('getAssignmentHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps history rows and formats labels', async () => {
    mockLimit.mockResolvedValue({
      data: [
        { id: 'h1', change_type: 'created', new_data: null, changed_at: '2026-07-10T00:00:00Z' },
        {
          id: 'h2',
          change_type: 'status_changed',
          new_data: { status: 'in_progress' },
          changed_at: '2026-07-11T00:00:00Z',
        },
        {
          id: 'h3',
          change_type: 'custom_event',
          new_data: null,
          changed_at: '2026-07-12T00:00:00Z',
        },
      ],
      error: null,
    });

    const result = await getAssignmentHistory('a1');
    expect(result).toEqual([
      { id: 'h1', changeType: 'created', label: 'Created', changedAt: '2026-07-10T00:00:00Z' },
      {
        id: 'h2',
        changeType: 'status_changed',
        label: 'Status changed to in progress',
        changedAt: '2026-07-11T00:00:00Z',
      },
      {
        id: 'h3',
        changeType: 'custom_event',
        label: 'custom event',
        changedAt: '2026-07-12T00:00:00Z',
      },
    ]);
  });

  it('returns empty array when supabase resolves a null payload without error', async () => {
    mockLimit.mockResolvedValue({ data: null, error: null });
    expect(await getAssignmentHistory('a1')).toEqual([]);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('returns empty array on error and logs it', async () => {
    mockLimit.mockResolvedValue({ data: null, error: { code: 'ERR', message: 'fail' } });
    expect(await getAssignmentHistory('a1')).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith('[assignment-detail-queries] history error', {
      error: 'fail',
      code: 'ERR',
    });
  });
});
