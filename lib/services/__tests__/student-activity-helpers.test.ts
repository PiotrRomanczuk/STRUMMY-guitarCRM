import { updateSingleStudentStatus, getStudentActivityInfo } from '../student-activity-helpers';

const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockIn = jest.fn();
const mockSingle = jest.fn();
const mockIs = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();
const mockGte = jest.fn();
const mockUpdate = jest.fn();
const mockInsert = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn((table) => {
        if (table === 'user_history') {
          return { insert: mockInsert };
        }
        const chain = {
          select: mockSelect.mockImplementation(() => chain),
          eq: mockEq.mockImplementation(() => chain),
          in: mockIn.mockImplementation(() => chain),
          single: mockSingle.mockImplementation(() => chain),
          is: mockIs.mockImplementation(() => chain),
          order: mockOrder.mockImplementation(() => chain),
          limit: mockLimit.mockImplementation(() => chain),
          gte: mockGte.mockImplementation(() => chain),
          update: mockUpdate.mockImplementation(() => chain),
        };
        return chain;
      }),
    })
  ),
}));

describe('student-activity-helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateSingleStudentStatus', () => {
    it('returns false if student not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
      const result = await updateSingleStudentStatus('s1');
      expect(result).toEqual({ updated: false, previousStatus: null, newStatus: null });
    });

    it('archives an active student with no recent or future lessons', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: 's1', student_status: 'active' },
        error: null,
      });
      // lastCompleted
      mockSingle.mockResolvedValueOnce({
        data: { scheduled_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
        error: null,
      });
      // nextScheduled
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await updateSingleStudentStatus('s1');

      expect(result.updated).toBe(true);
      expect(result.previousStatus).toBe('active');
      expect(result.newStatus).toBe('archived');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ student_status: 'archived' })
      );
      expect(mockInsert).toHaveBeenCalled();
    });

    it('activates an archived student with future lessons', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: 's2', student_status: 'archived' },
        error: null,
      });
      // lastCompleted
      mockSingle.mockResolvedValueOnce({ data: null, error: null });
      // nextScheduled
      mockSingle.mockResolvedValueOnce({
        data: { scheduled_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() },
        error: null,
      });

      const result = await updateSingleStudentStatus('s2');

      expect(result.updated).toBe(true);
      expect(result.previousStatus).toBe('archived');
      expect(result.newStatus).toBe('active');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ student_status: 'active' })
      );
      expect(mockInsert).toHaveBeenCalled();
    });

    it('does nothing if status should not change', async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: 's3', student_status: 'active' },
        error: null,
      });
      // lastCompleted
      mockSingle.mockResolvedValueOnce({
        data: { scheduled_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
        error: null,
      });
      // nextScheduled
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await updateSingleStudentStatus('s3');

      expect(result.updated).toBe(false);
      expect(result.previousStatus).toBe('active');
      expect(result.newStatus).toBe('active');
      expect(mockUpdate).not.toHaveBeenCalled();
      expect(mockInsert).not.toHaveBeenCalled();
    });
  });

  describe('getStudentActivityInfo', () => {
    it('returns nulls if student not found', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: null });
      const result = await getStudentActivityInfo('s1');
      expect(result.studentStatus).toBeNull();
    });

    it('returns activity info based on dates', async () => {
      mockSingle.mockResolvedValueOnce({ data: { student_status: 'active' }, error: null });
      const lastCompletedDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
      mockSingle.mockResolvedValueOnce({ data: { scheduled_at: lastCompletedDate }, error: null });
      mockSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await getStudentActivityInfo('s1');

      expect(result.studentStatus).toBe('active');
      expect(result.lastCompletedLessonDate).toBe(lastCompletedDate);
      expect(result.nextScheduledLessonDate).toBeNull();
      expect(result.daysSinceLastLesson).toBe(40);
      expect(result.shouldBeInactive).toBe(true); // inactive for 40 days, no future lessons
      expect(result.shouldBeActive).toBe(false);
    });

    it('reports a null day count for a student with no completed lesson yet', async () => {
      mockSingle.mockResolvedValueOnce({ data: { student_status: 'archived' }, error: null });
      mockSingle.mockResolvedValueOnce({ data: null, error: null }); // no completed lesson
      const nextScheduledDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      mockSingle.mockResolvedValueOnce({ data: { scheduled_at: nextScheduledDate }, error: null });

      const result = await getStudentActivityInfo('s1');

      expect(result.studentStatus).toBe('archived');
      expect(result.lastCompletedLessonDate).toBeNull();
      expect(result.nextScheduledLessonDate).toBe(nextScheduledDate);
      expect(result.daysSinceLastLesson).toBeNull();
      expect(result.shouldBeInactive).toBe(false); // a future lesson keeps them active
      expect(result.shouldBeActive).toBe(true);
    });
  });
});
