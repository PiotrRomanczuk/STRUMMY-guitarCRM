import {
  hasGoogleIntegration,
  syncLessonCreation,
  syncLessonUpdate,
  syncLessonDeletion,
} from '../calendar-lesson-sync';
import { createClient } from '@/lib/supabase/server';
import * as googleLib from '@/lib/google';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/google', () => ({
  createGoogleCalendarEvent: jest.fn(),
  updateGoogleCalendarEvent: jest.fn(),
  deleteGoogleCalendarEvent: jest.fn(),
}));

describe('calendar-lesson-sync', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    update: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('hasGoogleIntegration', () => {
    it('should return true when user has valid Google integration', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { access_token: 'valid-token' },
        error: null,
      });

      const result = await hasGoogleIntegration(mockSupabase as never, 'user-123');

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_integrations');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockSupabase.eq).toHaveBeenCalledWith('provider', 'google');
    });

    it('should return false when user has no integration', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await hasGoogleIntegration(mockSupabase as never, 'user-123');

      expect(result).toBe(false);
    });

    it('should return false when access token is empty', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { access_token: '' },
        error: null,
      });

      const result = await hasGoogleIntegration(mockSupabase as never, 'user-123');

      expect(result).toBe(false);
    });
  });

  describe('syncLessonCreation', () => {
    const lessonData = {
      id: 'lesson-123',
      title: 'Guitar Lesson',
      scheduled_at: '2026-02-10T15:00:00Z',
      notes: 'Practice scales',
      student_id: 'student-123',
      teacher_id: 'teacher-123',
    };

    it('should create Google Calendar event and update lesson with event ID', async () => {
      // Mock hasGoogleIntegration
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { access_token: 'valid-token' },
          error: null,
        })
        // Mock getStudentEmail
        .mockResolvedValueOnce({
          data: { email: 'student@example.com' },
          error: null,
        });

      (googleLib.createGoogleCalendarEvent as jest.Mock).mockResolvedValue({
        eventId: 'event-456',
      });

      await syncLessonCreation(mockSupabase as never, lessonData);

      expect(googleLib.createGoogleCalendarEvent).toHaveBeenCalledWith('teacher-123', {
        title: 'Guitar Lesson',
        scheduled_at: '2026-02-10T15:00:00Z',
        notes: 'Practice scales',
        student_email: 'student@example.com',
      });

      expect(mockSupabase.update).toHaveBeenCalledWith({ google_event_id: 'event-456' });
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'lesson-123');
    });

    it('should send undefined notes when the lesson has none', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: { access_token: 'valid-token' }, error: null })
        .mockResolvedValueOnce({ data: { email: 'student@example.com' }, error: null });

      (googleLib.createGoogleCalendarEvent as jest.Mock).mockResolvedValue({
        eventId: 'event-456',
      });

      await syncLessonCreation(mockSupabase as never, { ...lessonData, notes: null });

      expect(googleLib.createGoogleCalendarEvent).toHaveBeenCalledWith('teacher-123', {
        title: 'Guitar Lesson',
        scheduled_at: '2026-02-10T15:00:00Z',
        notes: undefined,
        student_email: 'student@example.com',
      });
    });

    it('should skip sync when teacher has no Google integration', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await syncLessonCreation(mockSupabase as never, lessonData);

      expect(googleLib.createGoogleCalendarEvent).not.toHaveBeenCalled();
    });

    it('should skip sync when student has no email', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { access_token: 'valid-token' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' },
        });

      await syncLessonCreation(mockSupabase as never, lessonData);

      expect(googleLib.createGoogleCalendarEvent).not.toHaveBeenCalled();
    });

    it('should handle Google Calendar API errors gracefully', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { access_token: 'valid-token' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { email: 'student@example.com' },
          error: null,
        });

      (googleLib.createGoogleCalendarEvent as jest.Mock).mockRejectedValue(
        new Error('Google API error')
      );

      // Should not throw
      await expect(syncLessonCreation(mockSupabase as never, lessonData)).resolves.not.toThrow();
    });
  });

  describe('syncLessonUpdate', () => {
    const lessonData = {
      id: 'lesson-123',
      title: 'Guitar Lesson',
      scheduled_at: '2026-02-10T15:00:00Z',
      notes: 'Practice scales',
      student_id: 'student-123',
      teacher_id: 'teacher-123',
      google_event_id: 'event-456',
    };

    it('should update Google Calendar event when lesson has event ID', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { access_token: 'valid-token' },
        error: null,
      });

      await syncLessonUpdate(mockSupabase as never, lessonData, {
        title: 'Updated Lesson',
        scheduled_at: '2026-02-15T16:00:00Z',
      });

      expect(googleLib.updateGoogleCalendarEvent).toHaveBeenCalledWith('teacher-123', 'event-456', {
        title: 'Updated Lesson',
        scheduled_at: '2026-02-15T16:00:00Z',
        notes: undefined,
      });
    });

    it('should skip sync when lesson has no Google event ID', async () => {
      const lessonWithoutEventId = { ...lessonData, google_event_id: null };

      await syncLessonUpdate(mockSupabase as never, lessonWithoutEventId, {
        title: 'Updated Lesson',
      });

      expect(googleLib.updateGoogleCalendarEvent).not.toHaveBeenCalled();
    });

    it('should skip sync when teacher has no Google integration', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await syncLessonUpdate(mockSupabase as never, lessonData, {
        title: 'Updated Lesson',
      });

      expect(googleLib.updateGoogleCalendarEvent).not.toHaveBeenCalled();
    });

    it('should handle Google Calendar API errors gracefully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { access_token: 'valid-token' },
        error: null,
      });

      (googleLib.updateGoogleCalendarEvent as jest.Mock).mockRejectedValue(
        new Error('Google API error')
      );

      // Should not throw
      await expect(
        syncLessonUpdate(mockSupabase as never, lessonData, { title: 'Updated' })
      ).resolves.not.toThrow();
    });
  });

  describe('syncLessonDeletion', () => {
    it('should delete Google Calendar event when lesson has event ID', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            google_event_id: 'event-456',
            teacher_id: 'teacher-123',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { access_token: 'valid-token' },
          error: null,
        });

      await syncLessonDeletion(mockSupabase as never, 'lesson-123');

      expect(googleLib.deleteGoogleCalendarEvent).toHaveBeenCalledWith('teacher-123', 'event-456');
    });

    it('should skip sync when lesson not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      await syncLessonDeletion(mockSupabase as never, 'lesson-123');

      expect(googleLib.deleteGoogleCalendarEvent).not.toHaveBeenCalled();
    });

    it('should skip sync when lesson has no Google event ID', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          google_event_id: null,
          teacher_id: 'teacher-123',
        },
        error: null,
      });

      await syncLessonDeletion(mockSupabase as never, 'lesson-123');

      expect(googleLib.deleteGoogleCalendarEvent).not.toHaveBeenCalled();
    });

    it('should skip sync when teacher has no Google integration', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            google_event_id: 'event-456',
            teacher_id: 'teacher-123',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' },
        });

      await syncLessonDeletion(mockSupabase as never, 'lesson-123');

      expect(googleLib.deleteGoogleCalendarEvent).not.toHaveBeenCalled();
    });

    it('should handle Google Calendar API errors gracefully', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({
          data: {
            google_event_id: 'event-456',
            teacher_id: 'teacher-123',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { access_token: 'valid-token' },
          error: null,
        });

      (googleLib.deleteGoogleCalendarEvent as jest.Mock).mockRejectedValue(
        new Error('Google API error')
      );

      // Should not throw
      await expect(syncLessonDeletion(mockSupabase as never, 'lesson-123')).resolves.not.toThrow();
    });
  });
});
