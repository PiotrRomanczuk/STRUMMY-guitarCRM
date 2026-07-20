import {
  getTeacherDayLessons,
  summariseDayLessons,
  type DayLesson,
} from '../teacher-dashboard-queries';
import { logger } from '@/lib/logger';

const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIs = jest.fn();
const mockGte = jest.fn();
const mockLt = jest.fn();
const mockOrder = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn(() => {
        const chain = {
          select: mockSelect.mockImplementation(() => chain),
          eq: mockEq.mockImplementation(() => chain),
          is: mockIs.mockImplementation(() => chain),
          gte: mockGte.mockImplementation(() => chain),
          lt: mockLt.mockImplementation(() => chain),
          order: mockOrder.mockImplementation(() => chain),
        };
        return chain;
      }),
    })
  ),
}));

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}));

describe('teacher-dashboard-queries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTeacherDayLessons', () => {
    it('returns formatted day lessons', async () => {
      const mockDate = new Date('2026-07-20T12:00:00Z');
      mockOrder.mockResolvedValueOnce({
        data: [
          {
            id: 'l1',
            scheduled_at: '2026-07-20T14:00:00Z',
            status: 'scheduled',
            title: 'Guitar Lesson',
            student: [{ id: 's1', full_name: 'Student Bob', email: 'bob@example.com' }],
            lesson_songs: [
              { song_id: 'song1', songs: [{ title: 'Wonderwall', key: 'C' }] },
              { song_id: 'song2', songs: null }, // unreadable song
            ],
          },
        ],
        error: null,
      });

      const lessons = await getTeacherDayLessons('t1', mockDate);

      expect(lessons).toEqual([
        {
          id: 'l1',
          scheduledAt: '2026-07-20T14:00:00Z',
          status: 'scheduled',
          title: 'Guitar Lesson',
          studentId: 's1',
          studentName: 'Student Bob',
          studentEmail: 'bob@example.com',
          songs: [{ songId: 'song1', title: 'Wonderwall', songKey: 'C' }],
        },
      ]);

      expect(mockEq).toHaveBeenCalledWith('teacher_id', 't1');
      expect(mockIs).toHaveBeenCalledWith('deleted_at', null);
      const start = new Date(mockDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      expect(mockGte).toHaveBeenCalledWith('scheduled_at', start.toISOString());
      expect(mockLt).toHaveBeenCalledWith('scheduled_at', end.toISOString());
    });

    it('returns empty array and logs on error', async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: { message: 'db err', code: 'ERR' } });
      const lessons = await getTeacherDayLessons('t1', new Date());
      expect(lessons).toEqual([]);
      expect(logger.warn).toHaveBeenCalledWith('[teacher-dashboard-queries] day lessons error', {
        error: 'db err',
        code: 'ERR',
      });
    });

    it('handles object-shaped joins, a keyless song, and a missing student', async () => {
      mockOrder.mockResolvedValueOnce({
        data: [
          {
            id: 'l1',
            scheduled_at: '2026-07-20T14:00:00Z',
            status: 'scheduled',
            title: null,
            student: { id: 's1', full_name: null, email: null },
            lesson_songs: [{ song_id: 'song1', songs: { title: 'Blackbird', key: null } }],
          },
          {
            id: 'l2',
            scheduled_at: '2026-07-20T15:00:00Z',
            status: 'scheduled',
            title: 'Orphan',
            student: null,
            lesson_songs: null,
          },
        ],
        error: null,
      });

      expect(await getTeacherDayLessons('t1', new Date('2026-07-20T12:00:00Z'))).toEqual([
        {
          id: 'l1',
          scheduledAt: '2026-07-20T14:00:00Z',
          status: 'scheduled',
          title: null,
          studentId: 's1',
          studentName: null,
          studentEmail: null,
          songs: [{ songId: 'song1', title: 'Blackbird', songKey: null }],
        },
        {
          id: 'l2',
          scheduledAt: '2026-07-20T15:00:00Z',
          status: 'scheduled',
          title: 'Orphan',
          studentId: '',
          studentName: null,
          studentEmail: null,
          songs: [],
        },
      ]);
    });

    it('returns empty array when supabase resolves a null payload without error', async () => {
      mockOrder.mockResolvedValueOnce({ data: null, error: null });
      expect(await getTeacherDayLessons('t1', new Date('2026-07-20T12:00:00Z'))).toEqual([]);
      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  describe('summariseDayLessons', () => {
    it('calculates counts and minutes at the default lesson length', () => {
      const lesson = (id: string): DayLesson => ({
        id,
        scheduledAt: '2026-07-20T10:00:00Z',
        status: 'SCHEDULED',
        title: null,
        studentId: 's1',
        studentName: null,
        studentEmail: null,
        songs: [],
      });
      expect(summariseDayLessons([lesson('1'), lesson('2')])).toEqual({
        count: 2,
        totalMinutes: 90,
      });
    });
  });
});
