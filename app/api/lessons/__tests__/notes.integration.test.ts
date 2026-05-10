/**
 * Integration tests: lesson notes — covers the unbreakable-core scenarios
 *   notes:no-silent-save-failure
 *   notes:partial-update-preserves
 *   notes:long-text-accepted
 *   notes:empty-is-valid
 *   notes:past-immutable-by-student
 *
 * Calls updateLessonHandler directly with a mocked Supabase chain.
 */

jest.mock('@/lib/services/calendar-lesson-sync', () => ({
  syncLessonCreation: jest.fn().mockResolvedValue(undefined),
  syncLessonUpdate: jest.fn().mockResolvedValue(undefined),
  syncLessonDeletion: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/services/notification-service', () => ({
  sendNotification: jest.fn().mockResolvedValue({ success: true }),
  cancelPendingQueueEntries: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

import {
  createMockQueryBuilder,
  createMockAuthContext,
  MOCK_DATA_IDS,
} from '@/lib/testing/integration-helpers';
import { updateLessonHandler } from '@/app/api/lessons/handlers';

const teacherCtx = createMockAuthContext('teacher');
const studentCtx = createMockAuthContext('student');

const baseLesson = {
  id: MOCK_DATA_IDS.lesson,
  student_id: studentCtx.userId,
  teacher_id: teacherCtx.userId,
  title: 'Lesson 12',
  notes: 'Original notes',
  scheduled_at: '2026-03-01T15:00:00.000Z',
  status: 'SCHEDULED',
};

describe('lesson notes — unbreakable scenarios', () => {
  describe('notes:past-immutable-by-student (403)', () => {
    it('returns 403 when a student attempts to update notes on any lesson', async () => {
      const qb = createMockQueryBuilder(baseLesson);
      const supabase = { from: jest.fn(() => qb) };

      const result = await updateLessonHandler(
        supabase as never,
        studentCtx.user,
        studentCtx.profileMapped,
        MOCK_DATA_IDS.lesson,
        { notes: 'Student trying to edit' }
      );

      expect(result.status).toBe(403);
      expect(result.error).toMatch(/Only admins and teachers/);
      expect(qb.update).not.toHaveBeenCalled();
    });

    it('returns 401 when unauthenticated', async () => {
      const qb = createMockQueryBuilder(baseLesson);
      const supabase = { from: jest.fn(() => qb) };

      const result = await updateLessonHandler(
        supabase as never,
        null,
        null,
        MOCK_DATA_IDS.lesson,
        { notes: 'No session' }
      );

      expect(result.status).toBe(401);
    });
  });

  describe('notes:no-silent-save-failure', () => {
    it('returns {error, status: 500} when the database update fails — never a silent success', async () => {
      const qb = createMockQueryBuilder();
      qb.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'permission denied', code: 'PGRST301' },
      });
      const supabase = { from: jest.fn(() => qb) };

      const result = await updateLessonHandler(
        supabase as never,
        teacherCtx.user,
        teacherCtx.profileMapped,
        MOCK_DATA_IDS.lesson,
        { notes: 'Important session notes' }
      );

      expect(result.lesson).toBeUndefined();
      expect(result.error).toMatch(/permission denied/);
      expect(result.status).toBe(500);
    });
  });

  describe('notes:partial-update-preserves', () => {
    it('updating only `status` does not include `notes` in the DB payload', async () => {
      const qb = createMockQueryBuilder({ ...baseLesson, status: 'COMPLETED' });
      qb.single.mockResolvedValueOnce({
        data: { ...baseLesson, status: 'COMPLETED' },
        error: null,
      });
      const supabase = { from: jest.fn(() => qb) };

      await updateLessonHandler(
        supabase as never,
        teacherCtx.user,
        teacherCtx.profileMapped,
        MOCK_DATA_IDS.lesson,
        { status: 'COMPLETED' }
      );

      expect(qb.update).toHaveBeenCalledTimes(1);
      const payload = qb.update.mock.calls[0][0];
      expect(payload).not.toHaveProperty('notes');
      expect(payload).toHaveProperty('status', 'COMPLETED');
    });

    it('updating `notes` does not include unrelated fields like `student_id` in the payload', async () => {
      const qb = createMockQueryBuilder({ ...baseLesson, notes: 'New' });
      qb.single.mockResolvedValueOnce({
        data: { ...baseLesson, notes: 'New' },
        error: null,
      });
      const supabase = { from: jest.fn(() => qb) };

      await updateLessonHandler(
        supabase as never,
        teacherCtx.user,
        teacherCtx.profileMapped,
        MOCK_DATA_IDS.lesson,
        { notes: 'New' }
      );

      const payload = qb.update.mock.calls[0][0];
      expect(payload).toHaveProperty('notes', 'New');
      expect(payload).not.toHaveProperty('student_id');
      expect(payload).not.toHaveProperty('teacher_id');
      expect(payload).not.toHaveProperty('scheduled_at');
    });
  });

  describe('notes:long-text-accepted', () => {
    it('accepts a 5 000-character notes payload without truncation or 4xx', async () => {
      const longNotes = 'x'.repeat(5000);
      const qb = createMockQueryBuilder({ ...baseLesson, notes: longNotes });
      qb.single.mockResolvedValueOnce({
        data: { ...baseLesson, notes: longNotes },
        error: null,
      });
      const supabase = { from: jest.fn(() => qb) };

      const result = await updateLessonHandler(
        supabase as never,
        teacherCtx.user,
        teacherCtx.profileMapped,
        MOCK_DATA_IDS.lesson,
        { notes: longNotes }
      );

      expect(result.status).toBe(200);
      const payload = qb.update.mock.calls[0][0];
      expect(payload.notes).toHaveLength(5000);
    });
  });

  describe('notes:empty-is-valid', () => {
    it('saving notes="" succeeds and persists an empty string (clears existing notes)', async () => {
      const qb = createMockQueryBuilder({ ...baseLesson, notes: '' });
      qb.single.mockResolvedValueOnce({
        data: { ...baseLesson, notes: '' },
        error: null,
      });
      const supabase = { from: jest.fn(() => qb) };

      const result = await updateLessonHandler(
        supabase as never,
        teacherCtx.user,
        teacherCtx.profileMapped,
        MOCK_DATA_IDS.lesson,
        { notes: '' }
      );

      expect(result.status).toBe(200);
      const payload = qb.update.mock.calls[0][0];
      expect(payload).toHaveProperty('notes', '');
    });
  });

  describe('create-lesson:update-doesnt-reattach-songs', () => {
    it('updating only notes never touches lesson_songs (no re-insert of existing links)', async () => {
      const qb = createMockQueryBuilder({ ...baseLesson, notes: 'New' });
      qb.single.mockResolvedValueOnce({
        data: { ...baseLesson, notes: 'New' },
        error: null,
      });
      const fromSpy = jest.fn(() => qb);
      const supabase = { from: fromSpy };

      await updateLessonHandler(
        supabase as never,
        teacherCtx.user,
        teacherCtx.profileMapped,
        MOCK_DATA_IDS.lesson,
        { notes: 'New' }
      );

      // Only the lessons table should be touched.
      const tables = fromSpy.mock.calls.map((c) => c[0]);
      expect(tables).not.toContain('lesson_songs');
    });
  });
});
