/**
 * Integration tests for Lesson API handler functions.
 *
 * Pure handler tests with mock Supabase clients — mirrors the
 * Song handlers integration suite (see __tests__/api/song/handlers.integration.test.ts).
 *
 * Covers the four critical-path lesson handlers:
 *   - getLessonsHandler
 *   - createLessonHandler
 *   - updateLessonHandler
 *   - deleteLessonHandler
 *
 * Part of the Phase 1.5 critical-path test set. See tasks/critical-path-tests.md.
 */

import {
  getLessonsHandler,
  createLessonHandler,
  updateLessonHandler,
  deleteLessonHandler,
} from '@/app/api/lessons/handlers';
import { createMockQueryBuilder } from '@/lib/testing/integration-helpers';

jest.mock('@/lib/services/calendar-lesson-sync', () => ({
  syncLessonCreation: jest.fn().mockResolvedValue(undefined),
  syncLessonUpdate: jest.fn().mockResolvedValue(undefined),
  syncLessonDeletion: jest.fn().mockResolvedValue(undefined),
}));

const TEACHER_ID = '00000000-0000-4000-a000-000000000001';
const STUDENT_ID = '00000000-0000-4000-a000-000000000002';
const LESSON_ID = '00000000-0000-4000-a000-00000000000A';

function teacherProfile() {
  return { isAdmin: false, isTeacher: true, isStudent: false };
}

function studentProfile() {
  return { isAdmin: false, isTeacher: false, isStudent: true };
}

function buildSupabase(qb: ReturnType<typeof createMockQueryBuilder>) {
  return {
    from: jest.fn().mockReturnValue(qb),
    rpc: jest.fn(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asAny = <T>(v: T): any => v;

describe('Lesson Handlers — Integration', () => {
  afterEach(() => jest.clearAllMocks());

  describe('getLessonsHandler', () => {
    it('returns 401 when user is null', async () => {
      const qb = createMockQueryBuilder([]);
      const result = await getLessonsHandler(asAny(buildSupabase(qb)), null, teacherProfile(), {});
      expect(result).toEqual({ error: 'Unauthorized', status: 401 });
    });

    it('returns 404 when profile is missing', async () => {
      const qb = createMockQueryBuilder([]);
      const result = await getLessonsHandler(
        asAny(buildSupabase(qb)),
        { id: TEACHER_ID },
        null,
        {}
      );
      expect(result).toEqual({ error: 'Profile not found', status: 404 });
    });

    it('returns 200 with lessons for a teacher (visibility via RLS)', async () => {
      const lessons = [{ id: LESSON_ID, title: 'L1', deleted_at: null }];
      const qb = createMockQueryBuilder(lessons);
      const supabase = buildSupabase(qb);

      const result = await getLessonsHandler(
        asAny(supabase),
        { id: TEACHER_ID },
        teacherProfile(),
        {}
      );

      expect(result.status).toBe(200);
      expect(supabase.from).toHaveBeenCalledWith('lessons');
      expect(qb.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('applies studentId filter when supplied', async () => {
      const qb = createMockQueryBuilder([]);
      await getLessonsHandler(asAny(buildSupabase(qb)), { id: TEACHER_ID }, teacherProfile(), {
        studentId: STUDENT_ID,
      });
      expect(qb.eq).toHaveBeenCalledWith('student_id', STUDENT_ID);
    });

    it('uppercases status filter values', async () => {
      const qb = createMockQueryBuilder([]);
      await getLessonsHandler(asAny(buildSupabase(qb)), { id: TEACHER_ID }, teacherProfile(), {
        filter: 'scheduled',
      });
      expect(qb.eq).toHaveBeenCalledWith('status', 'SCHEDULED');
    });
  });

  describe('createLessonHandler', () => {
    it('returns 401 when user is null', async () => {
      const qb = createMockQueryBuilder();
      const result = await createLessonHandler(
        asAny(buildSupabase(qb)),
        null,
        teacherProfile(),
        {}
      );
      expect(result.status).toBe(401);
    });

    it('returns 403 for students', async () => {
      const qb = createMockQueryBuilder();
      const result = await createLessonHandler(
        asAny(buildSupabase(qb)),
        { id: STUDENT_ID },
        studentProfile(),
        { date: '2026-06-01', student_id: STUDENT_ID, teacher_id: TEACHER_ID }
      );
      expect(result.status).toBe(403);
    });

    it('returns 400 on invalid Zod payload', async () => {
      const qb = createMockQueryBuilder();
      const result = await createLessonHandler(
        asAny(buildSupabase(qb)),
        { id: TEACHER_ID },
        teacherProfile(),
        { not: 'a-valid-lesson' }
      );
      expect([400, 422]).toContain(result.status);
      expect(result.error).toBeDefined();
    });
  });

  describe('deleteLessonHandler', () => {
    it('returns 401 when user is null', async () => {
      const qb = createMockQueryBuilder();
      const result = await deleteLessonHandler(
        asAny(buildSupabase(qb)),
        null,
        teacherProfile(),
        LESSON_ID
      );
      expect(result.status).toBe(401);
    });

    it('returns 403 when student attempts a delete', async () => {
      const qb = createMockQueryBuilder();
      const result = await deleteLessonHandler(
        asAny(buildSupabase(qb)),
        { id: STUDENT_ID },
        studentProfile(),
        LESSON_ID
      );
      expect(result.status).toBe(403);
    });
  });

  describe('updateLessonHandler', () => {
    it('returns 401 when user is null', async () => {
      const qb = createMockQueryBuilder();
      const result = await updateLessonHandler(
        asAny(buildSupabase(qb)),
        null,
        teacherProfile(),
        LESSON_ID,
        {}
      );
      expect(result.status).toBe(401);
    });

    it('returns 403 when student attempts an update', async () => {
      const qb = createMockQueryBuilder();
      const result = await updateLessonHandler(
        asAny(buildSupabase(qb)),
        { id: STUDENT_ID },
        studentProfile(),
        LESSON_ID,
        { title: 'x' }
      );
      expect(result.status).toBe(403);
    });
  });
});
