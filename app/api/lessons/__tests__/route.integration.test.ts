/**
 * Integration tests: Lesson CRUD, validation, access control, utils, and recap email.
 *
 * Calls handlers directly with mocked Supabase — no HTTP layer.
 * Pattern: app/api/assignments/__tests__/route.integration.test.ts
 */

/* ---------- Mocks (BEFORE imports) ---------- */
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

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn().mockResolvedValue({
    user: { id: '00000000-bbbb-4000-a000-000000000002' },
    isAdmin: false,
    isTeacher: true,
    isStudent: false,
    isParent: false,
    isDevelopment: false,
  }),
}));

jest.mock('@/lib/auth/test-account-guard', () => ({
  guardTestAccountMutation: jest.fn().mockReturnValue(null),
  assertNotTestAccount: jest.fn(),
}));

/* ---------- Imports ---------- */
import {
  createMockQueryBuilder,
  createMockAuthContext,
  MOCK_DATA_IDS,
} from '@/lib/testing/integration-helpers';
import {
  getLessonsHandler,
  createLessonHandler,
  updateLessonHandler,
  deleteLessonHandler,
} from '@/app/api/lessons/handlers';
import {
  handleLessonSongsUpdate,
  prepareLessonForDb,
  transformLessonData,
} from '@/app/api/lessons/utils';
import { LessonInputSchema } from '@/schemas/LessonSchema';
import { sendNotification, cancelPendingQueueEntries } from '@/lib/services/notification-service';
import { createClient } from '@/lib/supabase/server';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { LessonFormActions } from '@/components/lessons/form/LessonForm.Actions';

/* ---------- Constants ---------- */
const teacherCtx = createMockAuthContext('teacher');
const adminCtx = createMockAuthContext('admin');
const studentCtx = createMockAuthContext('student');

const VALID_LESSON_INPUT = {
  student_id: studentCtx.userId,
  teacher_id: teacherCtx.userId,
  title: 'Chord Transitions',
  notes: 'Work on G to C',
  scheduled_at: '2026-03-01T15:00:00.000Z',
  date: '2026-03-01',
  start_time: '15:00',
};

const SAMPLE_LESSON = {
  id: MOCK_DATA_IDS.lesson,
  student_id: studentCtx.userId,
  teacher_id: teacherCtx.userId,
  title: 'Chord Transitions',
  notes: 'Work on G to C',
  scheduled_at: '2026-03-01T15:00:00.000Z',
  status: 'SCHEDULED',
  deleted_at: null,
  created_at: '2026-02-01T00:00:00.000Z',
  updated_at: '2026-02-01T00:00:00.000Z',
};

/* ========================================================== */
describe('Lesson CRUD integration', () => {
  /* ======================================================== */
  /* A1 — Lesson Creation                                     */
  /* ======================================================== */
  describe('POST /api/lessons (create)', () => {
    it('T1: teacher creates lesson with valid data — 201', async () => {
      const teacherProfile = { id: teacherCtx.userId, is_teacher: true };
      const studentProfile = { id: studentCtx.userId, is_student: true };

      const profileQb = createMockQueryBuilder(teacherProfile);
      // First single() → teacher profile check, second → student profile check
      profileQb.single
        .mockResolvedValueOnce({ data: teacherProfile, error: null })
        .mockResolvedValueOnce({ data: studentProfile, error: null });

      const lessonQb = createMockQueryBuilder(SAMPLE_LESSON);
      // insertLessonRecord → insert().select().single()
      lessonQb.single.mockResolvedValueOnce({ data: SAMPLE_LESSON, error: null });

      const supabase = {
        from: jest.fn((table: string) => {
          if (table === 'profiles') return profileQb;
          return lessonQb;
        }),
      };

      const result = await createLessonHandler(
        supabase as never,
        teacherCtx.user,
        teacherCtx.profileMapped,
        VALID_LESSON_INPUT
      );

      expect(result.status).toBe(201);
      expect(result.lesson).toBeDefined();
      expect(supabase.from).toHaveBeenCalledWith('lessons');
      expect(lessonQb.insert).toHaveBeenCalled();
    });

    it('T2: missing student_id returns 400', async () => {
      const supabase = { from: jest.fn() };
      const { student_id: _, ...inputWithout } = VALID_LESSON_INPUT;

      const result = await createLessonHandler(
        supabase as never,
        teacherCtx.user,
        teacherCtx.profileMapped,
        { ...inputWithout, student_id: '' }
      );

      expect(result.status).toBe(400);
      expect(result.error).toMatch(/student/i);
    });

    it('T3: missing teacher_id returns 400', async () => {
      const supabase = { from: jest.fn() };
      const { teacher_id: _, ...inputWithout } = VALID_LESSON_INPUT;

      const result = await createLessonHandler(
        supabase as never,
        teacherCtx.user,
        teacherCtx.profileMapped,
        { ...inputWithout, teacher_id: '' }
      );

      expect(result.status).toBe(400);
      expect(result.error).toMatch(/teacher/i);
    });

    it('T4: missing scheduled_at returns 400', async () => {
      const supabase = { from: jest.fn() };
      const { scheduled_at: _, ...inputWithout } = VALID_LESSON_INPUT;

      const result = await createLessonHandler(
        supabase as never,
        teacherCtx.user,
        teacherCtx.profileMapped,
        { ...inputWithout, scheduled_at: '' }
      );

      expect(result.status).toBe(400);
      expect(result.error).toMatch(/scheduled/i);
    });

    it('T5: student cannot create lesson — 403', async () => {
      const supabase = { from: jest.fn() };

      const result = await createLessonHandler(
        supabase as never,
        studentCtx.user,
        studentCtx.profileMapped,
        VALID_LESSON_INPUT
      );

      expect(result.status).toBe(403);
      expect(result.error).toMatch(/only admins and teachers/i);
    });
  });

  /* ======================================================== */
  /* A2 — Lesson Update                                       */
  /* ======================================================== */
  describe('PUT /api/lessons/:id (update)', () => {
    it('T6: teacher updates lesson — 200', async () => {
      const updatedLesson = { ...SAMPLE_LESSON, notes: 'Updated notes', status: 'COMPLETED' };
      const qb = createMockQueryBuilder(updatedLesson);
      // update().eq().select().single()
      qb.single.mockResolvedValueOnce({ data: updatedLesson, error: null });

      const supabase = { from: jest.fn(() => qb) };

      const result = await updateLessonHandler(
        supabase as never,
        teacherCtx.user,
        teacherCtx.profileMapped,
        MOCK_DATA_IDS.lesson,
        { notes: 'Updated notes', status: 'COMPLETED' }
      );

      expect(result.status).toBe(200);
      expect(result.lesson).toBeDefined();
      expect(qb.update).toHaveBeenCalled();
    });

    it('T7: handleLessonSongsUpdate inserts with status to_learn', async () => {
      const existingSongs = [{ song_id: 'old-song-1' }];
      const newSongIds = ['old-song-1', 'new-song-2'];

      const qb = createMockQueryBuilder(existingSongs);

      const supabase = { from: jest.fn(() => qb) };

      await handleLessonSongsUpdate(supabase as never, MOCK_DATA_IDS.lesson, newSongIds);

      // insert should have been called with records containing status: 'to_learn'
      expect(qb.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            lesson_id: MOCK_DATA_IDS.lesson,
            song_id: 'new-song-2',
            status: 'to_learn',
          }),
        ])
      );
    });

    it('T8: RESCHEDULED status rejected by Zod', () => {
      const result = LessonInputSchema.safeParse({
        ...VALID_LESSON_INPUT,
        status: 'RESCHEDULED',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const statusError = result.error.issues.find(
          (i) => i.path.includes('status')
        );
        expect(statusError).toBeDefined();
      }
    });

    it('T9: LessonFormActions renders correct button labels', () => {
      const noop = () => {};

      const { unmount } = render(
        React.createElement(LessonFormActions, {
          isSubmitting: false,
          onCancel: noop,
          isEditing: true,
        })
      );
      expect(screen.getByText('Save Changes')).toBeTruthy();
      unmount();

      render(
        React.createElement(LessonFormActions, {
          isSubmitting: false,
          onCancel: noop,
          isEditing: false,
        })
      );
      expect(screen.getByText('Create Lesson')).toBeTruthy();
    });
  });

  /* ======================================================== */
  /* A3 — Lesson Deletion                                     */
  /* ======================================================== */
  describe('DELETE /api/lessons/:id', () => {
    it('T10: soft delete sets deleted_at (not hard delete)', async () => {
      const qb = createMockQueryBuilder(null);
      const supabase = { from: jest.fn(() => qb) };

      const result = await deleteLessonHandler(
        supabase as never,
        teacherCtx.user,
        teacherCtx.profileMapped,
        MOCK_DATA_IDS.lesson
      );

      expect(result.status).toBe(200);
      // Must use update (soft delete), not delete
      expect(qb.update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.any(String) })
      );
      expect(qb.delete).not.toHaveBeenCalled();
    });

    it('T11: student cannot delete — 403', async () => {
      const supabase = { from: jest.fn() };

      const result = await deleteLessonHandler(
        supabase as never,
        studentCtx.user,
        studentCtx.profileMapped,
        MOCK_DATA_IDS.lesson
      );

      expect(result.status).toBe(403);
    });

    it('T12: unauthenticated returns 401', async () => {
      const supabase = { from: jest.fn() };

      const result = await deleteLessonHandler(
        supabase as never,
        null,
        null,
        MOCK_DATA_IDS.lesson
      );

      expect(result.status).toBe(401);
    });
  });

  /* ======================================================== */
  /* A4 — Access Control                                      */
  /* ======================================================== */
  describe('GET /api/lessons (access control)', () => {
    it('T13: teacher scoped to own lessons via student lookup', async () => {
      const teacherStudentIds = [studentCtx.userId];
      // First from('lessons') → getTeacherStudentIds
      const lessonsQb = createMockQueryBuilder(
        teacherStudentIds.map((id) => ({ student_id: id }))
      );

      const supabase = { from: jest.fn(() => lessonsQb) };

      const result = await getLessonsHandler(
        supabase as never,
        teacherCtx.user,
        teacherCtx.profileMapped,
        {}
      );

      expect(result.status).toBe(200);
      // Teacher filtering calls .in('student_id', [...])
      expect(lessonsQb.in).toHaveBeenCalled();
    });

    it('T14: admin sees all lessons (no teacher_id filter)', async () => {
      const qb = createMockQueryBuilder([SAMPLE_LESSON]);

      const supabase = { from: jest.fn(() => qb) };

      const result = await getLessonsHandler(
        supabase as never,
        adminCtx.user,
        adminCtx.profileMapped,
        {}
      );

      expect(result.status).toBe(200);
      // Admin path doesn't call .in() for student_id scoping
      const inCalls = qb.in.mock.calls;
      const studentIdFilter = inCalls.find(
        (call: unknown[]) => call[0] === 'student_id'
      );
      expect(studentIdFilter).toBeUndefined();
    });

    it('T15: unauthenticated list returns 401', async () => {
      const supabase = { from: jest.fn() };

      const result = await getLessonsHandler(supabase as never, null, null, {});

      expect(result.status).toBe(401);
    });
  });

  /* ======================================================== */
  /* A5 — Utils                                               */
  /* ======================================================== */
  describe('Utils', () => {
    it('T16: prepareLessonForDb merges date+time into scheduled_at', () => {
      const input = {
        student_id: studentCtx.userId,
        teacher_id: teacherCtx.userId,
        date: '2026-03-01',
        start_time: '15:00',
      };

      const result = prepareLessonForDb(input);

      expect(result.scheduled_at).toBeDefined();
      expect(typeof result.scheduled_at).toBe('string');
      // Should be an ISO string
      expect(() => new Date(result.scheduled_at).toISOString()).not.toThrow();
      // Virtual fields should be removed
      expect(result.date).toBeUndefined();
      expect(result.start_time).toBeUndefined();
      expect(result.song_ids).toBeUndefined();
      expect(result.lesson_teacher_number).toBeUndefined();
    });

    it('T17: prepareLessonForDb strips undefined values', () => {
      const input = {
        student_id: studentCtx.userId,
        title: undefined,
      };

      const result = prepareLessonForDb(input);

      expect(result.student_id).toBe(studentCtx.userId);
      expect('title' in result).toBe(false);
    });

    it('T18: transformLessonData splits scheduled_at into date+start_time', () => {
      const lesson = {
        id: MOCK_DATA_IDS.lesson,
        student_id: studentCtx.userId,
        teacher_id: teacherCtx.userId,
        scheduled_at: '2026-03-01T15:00:00.000Z',
        status: 'SCHEDULED' as const,
      };

      const result = transformLessonData(lesson);

      expect(result.date).toBeDefined();
      expect(result.start_time).toBeDefined();
      // Date should be YYYY-MM-DD format
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      // Time should be HH:MM format
      expect(result.start_time).toMatch(/^\d{2}:\d{2}$/);
    });

    it('T19: transformLessonData preserves existing date/start_time', () => {
      const lesson = {
        id: MOCK_DATA_IDS.lesson,
        student_id: studentCtx.userId,
        teacher_id: teacherCtx.userId,
        scheduled_at: '2026-03-01T15:00:00.000Z',
        date: '2026-04-15',
        start_time: '10:30',
        status: 'SCHEDULED' as const,
      };

      const result = transformLessonData(lesson);

      // When date/start_time are already present, they should be preserved
      expect(result.date).toBe('2026-04-15');
      expect(result.start_time).toBe('10:30');
    });
  });

  /* ======================================================== */
  /* A6 — Recap Email                                         */
  /* ======================================================== */
  describe('sendLessonSummaryEmail', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('T20: sends notification and cancels queued entries', async () => {
      const lessonWithJoins = {
        ...SAMPLE_LESSON,
        student_id: studentCtx.userId,
        student: { id: studentCtx.userId, email: 'student@test.com', full_name: 'Test Student' },
        teacher: { full_name: 'Test Teacher' },
        lesson_songs: [
          {
            notes: 'Practice slowly',
            status: 'to_learn',
            song: { title: 'Wonderwall', author: 'Oasis' },
          },
        ],
      };

      const qb = createMockQueryBuilder(lessonWithJoins);
      qb.single.mockResolvedValueOnce({ data: lessonWithJoins, error: null });

      const mockSupabase = {
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: teacherCtx.user }, error: null }) },
        from: jest.fn(() => qb),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      // Dynamic import to get the server action after mocks are set up
      const { sendLessonSummaryEmail } = await import(
        '@/app/dashboard/lessons/actions'
      );

      const result = await sendLessonSummaryEmail(MOCK_DATA_IDS.lesson);

      expect(result.success).toBe(true);
      expect(sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'lesson_recap' })
      );
      expect(cancelPendingQueueEntries).toHaveBeenCalledWith(
        'lesson',
        MOCK_DATA_IDS.lesson,
        'lesson_recap'
      );
    });

    it('T21: returns error for missing lesson', async () => {
      const qb = createMockQueryBuilder(null);
      qb.single.mockResolvedValueOnce({ data: null, error: null });

      const mockSupabase = {
        auth: { getUser: jest.fn().mockResolvedValue({ data: { user: teacherCtx.user }, error: null }) },
        from: jest.fn(() => qb),
      };
      (createClient as jest.Mock).mockResolvedValue(mockSupabase);

      const { sendLessonSummaryEmail } = await import(
        '@/app/dashboard/lessons/actions'
      );

      const result = await sendLessonSummaryEmail(MOCK_DATA_IDS.lesson);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not found/i);
    });
  });
});
