import { getStudentOptions, getSongOptions, getLessonForEdit } from '../lesson-form-data';
import { logger } from '@/lib/logger';

const mockOrder = jest.fn();
const mockSingle = jest.fn();
const mockIn = jest.fn();
const mockIs = jest.fn();
const mockEq = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: () => ({
        select: () => {
          const chain = {
            eq: mockEq.mockImplementation(() => {
              const eqChain = {
                order: mockOrder,
                is: mockIs.mockImplementation(() => ({ single: mockSingle })),
              };
              return eqChain;
            }),
            in: mockIn.mockImplementation(() => ({ order: mockOrder })),
            is: mockIs.mockImplementation(() => ({ order: mockOrder })),
          };
          return chain;
        },
      }),
    })
  ),
}));

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

describe('lesson-form-data', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStudentOptions', () => {
    it('returns all students for an admin', async () => {
      mockOrder.mockResolvedValue({
        data: [{ id: 's1', full_name: 'Student Bob', email: 'bob@example.com' }],
        error: null,
      });

      const result = await getStudentOptions('admin1', true);
      expect(mockEq).toHaveBeenCalledWith('is_student', true);
      expect(mockOrder).toHaveBeenCalledWith('full_name', { ascending: true });
      expect(result).toEqual([{ id: 's1', name: 'Student Bob', email: 'bob@example.com' }]);
    });

    it('returns scoped students for a teacher', async () => {
      // First query: teacher_students
      mockEq.mockResolvedValueOnce({
        data: [{ student_id: 's1' }, { student_id: 's2' }],
        error: null,
      });
      // Second query: profiles
      mockOrder.mockResolvedValueOnce({
        data: [
          { id: 's1', full_name: 'Student Bob', email: null },
          { id: 's2', full_name: 'Student Alice', email: 'alice@example.com' },
        ],
        error: null,
      });

      const result = await getStudentOptions('t1', false);
      expect(mockEq).toHaveBeenCalledWith('teacher_id', 't1');
      expect(mockIn).toHaveBeenCalledWith('id', ['s1', 's2']);
      expect(result).toEqual([
        { id: 's1', name: 'Student Bob', email: null },
        { id: 's2', name: 'Student Alice', email: 'alice@example.com' },
      ]);
    });

    it('returns empty array if teacher has no students', async () => {
      mockEq.mockResolvedValueOnce({ data: [], error: null });
      const result = await getStudentOptions('t1', false);
      expect(result).toEqual([]);
      expect(mockIn).not.toHaveBeenCalled();
    });

    it('returns empty array when the admin query resolves a null payload', async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: null });
      expect(await getStudentOptions('admin1', true)).toEqual([]);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('maps a nameless student profile to a null name', async () => {
      mockEq.mockResolvedValueOnce({ data: [{ student_id: 's1' }], error: null });
      mockOrder.mockResolvedValueOnce({
        data: [{ id: 's1', full_name: null, email: 'bob@example.com' }],
        error: null,
      });

      expect(await getStudentOptions('t1', false)).toEqual([
        { id: 's1', name: null, email: 'bob@example.com' },
      ]);
    });

    it('returns empty array when the teacher profiles query resolves a null payload', async () => {
      mockEq.mockResolvedValueOnce({ data: [{ student_id: 's1' }], error: null });
      mockOrder.mockResolvedValueOnce({ data: null, error: null });
      expect(await getStudentOptions('t1', false)).toEqual([]);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('returns empty array when the teacher_students query errors', async () => {
      mockEq.mockResolvedValueOnce({ data: null, error: { message: 'db error' } });
      expect(await getStudentOptions('t1', false)).toEqual([]);
      expect(mockIn).not.toHaveBeenCalled();
    });

    it('handles errors for admin queries', async () => {
      mockOrder.mockResolvedValue({ data: null, error: { message: 'db error' } });
      expect(await getStudentOptions('admin1', true)).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith('[lesson-form-data] admin student options error', {
        error: 'db error',
      });
    });

    it('handles errors for teacher profiles query', async () => {
      mockEq.mockResolvedValueOnce({ data: [{ student_id: 's1' }], error: null });
      mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'db error' } });
      expect(await getStudentOptions('t1', false)).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith('[lesson-form-data] teacher student options error', {
        error: 'db error',
      });
    });
  });

  describe('getSongOptions', () => {
    it('returns all active songs', async () => {
      mockOrder.mockResolvedValue({
        data: [{ id: 'song1', title: 'Wonderwall', author: 'Oasis' }],
        error: null,
      });

      const result = await getSongOptions();
      expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
      expect(mockOrder).toHaveBeenCalledWith('title', { ascending: true });
      expect(result).toEqual([{ id: 'song1', title: 'Wonderwall', author: 'Oasis' }]);
    });

    it('maps an author-less song to a null author', async () => {
      mockOrder.mockResolvedValueOnce({
        data: [{ id: 'song1', title: 'Untitled Riff', author: null }],
        error: null,
      });
      expect(await getSongOptions()).toEqual([
        { id: 'song1', title: 'Untitled Riff', author: null },
      ]);
    });

    it('returns empty array when the songs query resolves a null payload', async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: null });
      expect(await getSongOptions()).toEqual([]);
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('returns empty array on error and logs', async () => {
      mockOrder.mockResolvedValue({ data: null, error: { message: 'db error' } });
      expect(await getSongOptions()).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith('[lesson-form-data] song options error', {
        error: 'db error',
      });
    });
  });

  describe('getLessonForEdit', () => {
    it('returns mapped lesson data', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'L1',
          student_id: 's1',
          teacher_id: 't1',
          title: 'Title',
          notes: 'Notes',
          scheduled_at: '2026-07-20T10:00:00Z',
          status: 'scheduled',
          duration_minutes: 45,
          format: 'video',
          lesson_songs: [{ song_id: 'song1' }, { song_id: 'song2' }],
        },
        error: null,
      });

      const result = await getLessonForEdit('L1');
      expect(mockEq).toHaveBeenCalledWith('id', 'L1');
      expect(result).toEqual({
        id: 'L1',
        studentId: 's1',
        teacherId: 't1',
        title: 'Title',
        notes: 'Notes',
        scheduledAt: '2026-07-20T10:00:00Z',
        status: 'scheduled',
        durationMinutes: 45,
        format: 'video',
        songIds: ['song1', 'song2'],
      });
    });

    it('handles null values correctly', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'L2',
          student_id: 's1',
          teacher_id: 't1',
          title: null,
          notes: null,
          scheduled_at: '2026-07-20T10:00:00Z',
          status: 'scheduled',
          lesson_songs: null,
        },
        error: null,
      });

      const result = await getLessonForEdit('L2');
      expect(result?.title).toBeNull();
      expect(result?.notes).toBeNull();
      expect(result?.durationMinutes).toBeNull();
      expect(result?.format).toBeNull();
      expect(result?.songIds).toEqual([]);
    });

    it('returns null and logs on error (except PGRST116)', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'fail' } });
      expect(await getLessonForEdit('L1')).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith('[lesson-form-data] lesson-for-edit error', {
        error: 'fail',
      });
    });

    it('returns null silently on not found (PGRST116)', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });
      expect(await getLessonForEdit('L1')).toBeNull();
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });
});
