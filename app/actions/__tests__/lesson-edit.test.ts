/**
 * Unit tests for the editorial lesson create/update server actions.
 *
 * @see app/actions/lesson-edit.ts
 *
 * Note: `../lesson-edit.helpers` is mocked here on purpose — `resolveStudent`
 * has its own dedicated suite in `lesson-edit.helpers.test.ts`.
 */

import { createLessonAction, updateLessonAction } from '../lesson-edit';
import * as helpers from '../lesson-edit.helpers';
import * as utils from '@/app/api/lessons/utils';
import * as sync from '@/lib/services/calendar-lesson-sync';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import { revalidatePath } from 'next/cache';

/* ---------- Mocks (single registration per module) ---------- */

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn(),
}));

jest.mock('@/lib/auth/test-account-guard', () => ({
  guardTestAccountMutation: jest.fn(),
}));

jest.mock('@/app/api/lessons/utils', () => ({
  insertLessonRecord: jest.fn(),
  addSongsToLesson: jest.fn(),
  handleLessonSongsUpdate: jest.fn(),
  prepareLessonForDb: jest.fn((data) => data),
}));

jest.mock('@/lib/services/calendar-lesson-sync', () => ({
  syncLessonCreation: jest.fn(),
  syncLessonUpdate: jest.fn(),
}));

jest.mock('../lesson-edit.helpers', () => ({
  resolveStudent: jest.fn(),
}));

// One supabase mock for both actions. `updateLessonAction` is the only caller
// that drives a query chain directly; it is captured so the payload can be
// asserted. Spies are referenced lazily so hoisting stays safe.
const mockUpdate = jest.fn();
const mockSingle = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: () => ({
        update: (payload: Record<string, unknown>) => {
          mockUpdate(payload);
          return {
            eq: () => ({
              select: () => ({ single: () => mockSingle() }),
            }),
          };
        },
      }),
    })
  ),
}));

const mockLogError = jest.fn();
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({
    error: (...args: unknown[]) => mockLogError(...args),
    warn: jest.fn(),
    info: jest.fn(),
  }),
}));

/* ---------- Fixtures ---------- */

const TEACHER_ID = '123e4567-e89b-12d3-a456-426614174001';
const OTHER_TEACHER_ID = '123e4567-e89b-12d3-a456-426614174002';
const STUDENT_ID = '123e4567-e89b-12d3-a456-426614174000';
const SONG_ID = '123e4567-e89b-12d3-a456-42661417400a';
const AT = '2026-07-20T10:00:00Z';

const asTeacher = { user: { id: TEACHER_ID }, isTeacher: true, isAdmin: false };
const asAdmin = { user: { id: TEACHER_ID }, isTeacher: false, isAdmin: true };

const mockRoles = (roles: Record<string, unknown>) =>
  (getUserWithRolesSSR as jest.Mock).mockResolvedValue(roles);

describe('lesson-edit actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (guardTestAccountMutation as jest.Mock).mockReturnValue(null);
    (helpers.resolveStudent as jest.Mock).mockResolvedValue({ ok: true, studentId: STUDENT_ID });
    (utils.insertLessonRecord as jest.Mock).mockResolvedValue({ data: { id: 'L1' }, error: null });
    mockSingle.mockResolvedValue({ data: { id: 'L1' }, error: null });
  });

  describe('createLessonAction', () => {
    it('blocks demo/test accounts', async () => {
      mockRoles({ ...asTeacher, isDevelopment: true });
      (guardTestAccountMutation as jest.Mock).mockReturnValue({ error: 'Demo account' });

      expect(await createLessonAction({ scheduledAt: AT })).toEqual({ error: 'Demo account' });
      expect(utils.insertLessonRecord).not.toHaveBeenCalled();
    });

    it('requires auth and role', async () => {
      mockRoles({ user: null });
      expect(await createLessonAction({ scheduledAt: AT })).toEqual({ error: 'Unauthorized' });

      mockRoles({ user: { id: 's1' }, isAdmin: false, isTeacher: false });
      expect(await createLessonAction({ scheduledAt: AT })).toEqual({
        error: 'Only teachers and admins can create lessons',
      });
    });

    it('prevents teachers from creating lessons for other teachers', async () => {
      mockRoles(asTeacher);
      expect(await createLessonAction({ teacherId: OTHER_TEACHER_ID, scheduledAt: AT })).toEqual({
        error: 'Teachers can only create lessons for themselves',
      });
    });

    it('lets an admin create a lesson on behalf of another teacher', async () => {
      mockRoles(asAdmin);

      const result = await createLessonAction({ teacherId: OTHER_TEACHER_ID, scheduledAt: AT });

      expect(result).toEqual({ lessonId: 'L1' });
      expect(utils.insertLessonRecord).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ teacher_id: OTHER_TEACHER_ID })
      );
    });

    it('falls back to the caller as teacher when no teacherId is given', async () => {
      mockRoles(asAdmin);

      await createLessonAction({ scheduledAt: AT });

      expect(utils.insertLessonRecord).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ teacher_id: TEACHER_ID })
      );
    });

    it('returns error if resolveStudent fails', async () => {
      mockRoles(asTeacher);
      (helpers.resolveStudent as jest.Mock).mockResolvedValue({
        ok: false,
        error: 'ambiguous',
        ambiguous: true,
      });

      expect(await createLessonAction({ scheduledAt: AT })).toEqual({
        error: 'ambiguous',
        ambiguous: true,
      });
    });

    it('returns a validation error for an invalid payload', async () => {
      mockRoles(asTeacher);

      const result = await createLessonAction({ scheduledAt: '' });

      expect(result).toEqual({
        error: expect.stringContaining('Scheduled date & time is required'),
      });
      expect(utils.insertLessonRecord).not.toHaveBeenCalled();
    });

    it('coerces blank title and notes to undefined', async () => {
      mockRoles(asTeacher);

      await createLessonAction({ scheduledAt: AT, title: '', notes: '' });

      const [, payload] = (utils.insertLessonRecord as jest.Mock).mock.calls[0];
      expect(payload.title).toBeUndefined();
      expect(payload.notes).toBeUndefined();
    });

    it('logs and returns the db message when the insert errors', async () => {
      mockRoles(asTeacher);
      (utils.insertLessonRecord as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'insert exploded' },
      });

      expect(await createLessonAction({ scheduledAt: AT })).toEqual({ error: 'insert exploded' });
      expect(mockLogError).toHaveBeenCalledWith('Failed to insert lesson', expect.anything());
    });

    it('falls back to a generic message when the insert returns no row and no error', async () => {
      mockRoles(asTeacher);
      (utils.insertLessonRecord as jest.Mock).mockResolvedValue({ data: null, error: null });

      expect(await createLessonAction({ scheduledAt: AT })).toEqual({
        error: 'Failed to create lesson',
      });
      expect(mockLogError).toHaveBeenCalled();
    });

    it('skips song linking when songIds is empty or absent', async () => {
      mockRoles(asTeacher);

      await createLessonAction({ scheduledAt: AT });
      await createLessonAction({ scheduledAt: AT, songIds: [] });

      expect(utils.addSongsToLesson).not.toHaveBeenCalled();
    });

    it('creates a lesson successfully', async () => {
      mockRoles(asTeacher);

      const result = await createLessonAction({
        scheduledAt: AT,
        title: 'Title',
        notes: 'Notes',
        songIds: [SONG_ID],
      });

      expect(result).toEqual({ lessonId: 'L1' });
      expect(utils.addSongsToLesson).toHaveBeenCalledWith(expect.anything(), 'L1', [SONG_ID]);
      expect(sync.syncLessonCreation).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/lessons');
    });

    it('passes duration and format through to the insert payload', async () => {
      mockRoles(asTeacher);

      await createLessonAction({ scheduledAt: AT, durationMinutes: 45, format: 'in_person' });

      const [, payload] = (utils.insertLessonRecord as jest.Mock).mock.calls[0];
      expect(payload.duration_minutes).toBe(45);
      expect(payload.format).toBe('in_person');
    });
  });

  describe('updateLessonAction', () => {
    it('blocks demo/test accounts', async () => {
      mockRoles({ ...asTeacher, isDevelopment: true });
      (guardTestAccountMutation as jest.Mock).mockReturnValue({ error: 'Demo account' });

      expect(await updateLessonAction('L1', { scheduledAt: AT })).toEqual({
        error: 'Demo account',
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('requires auth and role', async () => {
      mockRoles({ user: null });
      expect(await updateLessonAction('L1', { scheduledAt: AT })).toEqual({
        error: 'Unauthorized',
      });

      mockRoles({ user: { id: 's1' }, isAdmin: false, isTeacher: false });
      expect(await updateLessonAction('L1', { scheduledAt: AT })).toEqual({
        error: 'Only teachers and admins can update lessons',
      });
    });

    it('returns a validation error for an invalid payload', async () => {
      mockRoles(asTeacher);

      const result = await updateLessonAction('L1', { scheduledAt: '' });

      expect(result).toEqual({
        error: expect.stringContaining('Scheduled date & time is required'),
      });
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('only writes whitelisted, defined fields', async () => {
      mockRoles(asTeacher);

      await updateLessonAction('L1', { scheduledAt: AT, title: 'New Title' });

      expect(mockUpdate).toHaveBeenCalledWith({ scheduled_at: AT, title: 'New Title' });
    });

    it('writes duration and format when provided', async () => {
      mockRoles(asTeacher);

      await updateLessonAction('L1', {
        scheduledAt: AT,
        durationMinutes: 60,
        format: 'video',
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ duration_minutes: 60, format: 'video' })
      );
    });

    it('returns error if lesson not found', async () => {
      mockRoles(asTeacher);
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });

      expect(await updateLessonAction('L1', { scheduledAt: AT })).toEqual({
        error: 'Lesson not found',
      });
      expect(mockLogError).not.toHaveBeenCalled();
    });

    it('logs and returns the db message on a non-PGRST116 failure', async () => {
      mockRoles(asTeacher);
      mockSingle.mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } });

      expect(await updateLessonAction('L1', { scheduledAt: AT })).toEqual({ error: 'denied' });
      expect(mockLogError).toHaveBeenCalledWith('Failed to update lesson', expect.anything());
    });

    it('falls back to a generic message when update returns no row and no error', async () => {
      mockRoles(asTeacher);
      mockSingle.mockResolvedValue({ data: null, error: null });

      expect(await updateLessonAction('L1', { scheduledAt: AT })).toEqual({
        error: 'Failed to update lesson',
      });
    });

    it('skips calendar sync when no synced field changed', async () => {
      mockRoles(asTeacher);

      const result = await updateLessonAction('L1', {
        scheduledAt: undefined as unknown as string,
        status: 'COMPLETED',
      });

      expect(result).toEqual({ lessonId: 'L1' });
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'COMPLETED' });
      expect(sync.syncLessonUpdate).not.toHaveBeenCalled();
      expect(utils.handleLessonSongsUpdate).not.toHaveBeenCalled();
    });

    it('syncs the calendar when notes are cleared to an empty string', async () => {
      mockRoles(asTeacher);

      await updateLessonAction('L1', {
        scheduledAt: undefined as unknown as string,
        notes: '',
      });

      expect(sync.syncLessonUpdate).toHaveBeenCalled();
    });

    it('updates a lesson successfully', async () => {
      mockRoles(asTeacher);

      const result = await updateLessonAction('L1', {
        scheduledAt: '2026-07-21T10:00:00Z',
        title: 'New Title',
        songIds: [SONG_ID],
      });

      expect(result).toEqual({ lessonId: 'L1' });
      expect(utils.handleLessonSongsUpdate).toHaveBeenCalledWith(expect.anything(), 'L1', [
        SONG_ID,
      ]);
      expect(sync.syncLessonUpdate).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard/lessons/L1');
    });
  });
});
