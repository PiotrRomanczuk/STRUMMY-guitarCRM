import {
  getStudentNextLesson,
  getStudentTopSongs,
  getStudentOpenAssignments,
} from '../student-dashboard-queries';
import { logger } from '@/lib/logger';
import * as assignmentListParams from '@/lib/services/assignment-list-params';

const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIs = jest.fn();
const mockGte = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockMaybeSingle = jest.fn();
const mockIn = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn(() => {
        const chain = {
          select: mockSelect.mockImplementation(() => chain),
          eq: mockEq.mockImplementation(() => chain),
          is: mockIs.mockImplementation(() => chain),
          gte: mockGte.mockImplementation(() => chain),
          order: mockOrder.mockImplementation(() => chain),
          limit: mockLimit.mockImplementation(() => chain),
          maybeSingle: mockMaybeSingle.mockImplementation(() => chain),
          in: mockIn.mockImplementation(() => chain),
        };
        return chain;
      }),
    })
  ),
}));

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

jest.mock('@/lib/services/assignment-list-params', () => ({
  deriveEffectiveStatus: jest.fn(),
}));

describe('student-dashboard-queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStudentNextLesson', () => {
    it('returns the next lesson', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'l1',
          scheduled_at: '2026-07-20T10:00:00Z',
          title: 'Lesson 1',
          teacher: [{ full_name: 'Teacher Alice' }],
        },
        error: null,
      });

      const nextLesson = await getStudentNextLesson('s1');
      expect(nextLesson).toEqual({
        id: 'l1',
        scheduledAt: '2026-07-20T10:00:00Z',
        title: 'Lesson 1',
        teacherName: 'Teacher Alice',
      });
      expect(mockEq).toHaveBeenCalledWith('student_id', 's1');
      expect(mockGte).toHaveBeenCalledWith('scheduled_at', expect.any(String));
      expect(mockOrder).toHaveBeenCalledWith('scheduled_at', { ascending: true });
    });

    it('returns null and logs on error', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'db err' } });
      const nextLesson = await getStudentNextLesson('s1');
      expect(nextLesson).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith('[student-dashboard] next lesson error', {
        error: 'db err',
      });
    });

    it('returns null if no data', async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });
      const nextLesson = await getStudentNextLesson('s1');
      expect(nextLesson).toBeNull();
    });

    it('handles an object-shaped teacher join with a null name and title', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'l1',
          scheduled_at: '2026-07-20T10:00:00Z',
          title: null,
          teacher: { full_name: null },
        },
        error: null,
      });

      expect(await getStudentNextLesson('s1')).toEqual({
        id: 'l1',
        scheduledAt: '2026-07-20T10:00:00Z',
        title: null,
        teacherName: null,
      });
    });

    it('returns a null teacher name when the teacher join is absent', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'l1',
          scheduled_at: '2026-07-20T10:00:00Z',
          title: 'Lesson 1',
          teacher: null,
        },
        error: null,
      });

      expect(await getStudentNextLesson('s1')).toEqual({
        id: 'l1',
        scheduledAt: '2026-07-20T10:00:00Z',
        title: 'Lesson 1',
        teacherName: null,
      });
    });
  });

  describe('getStudentTopSongs', () => {
    it('returns mapped top songs and filters out unreadable songs', async () => {
      mockLimit.mockResolvedValueOnce({
        data: [
          {
            song_id: 'song1',
            current_status: 'started',
            total_practice_minutes: 120,
            songs: [{ title: 'Wonderwall', author: 'Oasis' }],
          },
          {
            song_id: 'song2',
            current_status: 'mastered',
            total_practice_minutes: 300,
            songs: [{ title: null, author: null }], // unreadable
          },
        ],
        error: null,
      });

      const songs = await getStudentTopSongs('s1');
      expect(songs).toEqual([
        {
          songId: 'song1',
          title: 'Wonderwall',
          author: 'Oasis',
          status: 'started',
          totalPracticeMinutes: 120,
        },
      ]);
      expect(mockOrder).toHaveBeenCalledWith('last_practiced_at', {
        ascending: false,
        nullsFirst: false,
      });
    });

    it('returns empty array and logs on error', async () => {
      mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'db err' } });
      const songs = await getStudentTopSongs('s1');
      expect(songs).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith('[student-dashboard] songs error', {
        error: 'db err',
      });
    });

    it('handles an object-shaped song join and null practice minutes', async () => {
      mockLimit.mockResolvedValueOnce({
        data: [
          {
            song_id: 'song1',
            current_status: 'started',
            total_practice_minutes: null,
            songs: { title: 'Blackbird', author: null },
          },
          {
            song_id: 'song2',
            current_status: 'started',
            total_practice_minutes: 10,
            songs: null, // unreadable under RLS
          },
        ],
        error: null,
      });

      expect(await getStudentTopSongs('s1')).toEqual([
        {
          songId: 'song1',
          title: 'Blackbird',
          author: null,
          status: 'started',
          totalPracticeMinutes: 0,
        },
      ]);
    });

    it('returns empty array when supabase resolves a null payload without error', async () => {
      mockLimit.mockResolvedValueOnce({ data: null, error: null });
      expect(await getStudentTopSongs('s1')).toEqual([]);
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('getStudentOpenAssignments', () => {
    it('returns sorted assignments with effective status', async () => {
      mockLimit.mockResolvedValueOnce({
        data: [
          {
            id: 'a1',
            title: 'Assignment 1',
            due_date: '2026-07-20T10:00:00Z',
            status: 'not_started',
          },
          {
            id: 'a2',
            title: 'Assignment 2',
            due_date: '2026-07-10T10:00:00Z',
            status: 'in_progress',
          },
        ],
        error: null,
      });

      (assignmentListParams.deriveEffectiveStatus as jest.Mock)
        .mockReturnValueOnce('in_progress') // a1
        .mockReturnValueOnce('overdue'); // a2

      const assignments = await getStudentOpenAssignments('s1');

      expect(assignments).toEqual([
        { id: 'a2', title: 'Assignment 2', dueDate: '2026-07-10T10:00:00Z', isOverdue: true },
        { id: 'a1', title: 'Assignment 1', dueDate: '2026-07-20T10:00:00Z', isOverdue: false },
      ]);
      expect(mockIn).toHaveBeenCalledWith('status', ['not_started', 'in_progress', 'overdue']);
    });

    it('returns empty array and logs on error', async () => {
      mockLimit.mockResolvedValueOnce({ data: null, error: { message: 'db err' } });
      const assignments = await getStudentOpenAssignments('s1');
      expect(assignments).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith('[student-dashboard] assignments error', {
        error: 'db err',
      });
    });

    it('passes a null due date through to status derivation', async () => {
      mockLimit.mockResolvedValueOnce({
        data: [{ id: 'a1', title: 'Assignment 1', due_date: null, status: 'not_started' }],
        error: null,
      });
      (assignmentListParams.deriveEffectiveStatus as jest.Mock).mockReturnValue('not_started');

      expect(await getStudentOpenAssignments('s1')).toEqual([
        { id: 'a1', title: 'Assignment 1', dueDate: null, isOverdue: false },
      ]);
      expect(assignmentListParams.deriveEffectiveStatus).toHaveBeenCalledWith(null, 'not_started');
    });

    it('returns empty array when supabase resolves a null payload without error', async () => {
      mockLimit.mockResolvedValueOnce({ data: null, error: null });
      expect(await getStudentOpenAssignments('s1')).toEqual([]);
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });
});
