/**
 * Notification Preferences Server Actions Tests
 *
 * Tests the notification preferences management server actions:
 * - getUserNotificationPreferences
 * - updateNotificationPreference
 * - updateAllNotificationPreferences
 *
 * @see app/actions/notification-preferences.ts
 */

import {
  getUserNotificationPreferences,
  updateNotificationPreference,
  updateAllNotificationPreferences,
} from '../notification-preferences';
import { NotificationType } from '@/types/notifications';

// Mock getUserWithRolesSSR
jest.mock('@/lib/getUserWithRolesSSR', () => ({
  getUserWithRolesSSR: jest.fn(() => Promise.resolve({ isDevelopment: false })),
}));

// Mock createClient
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}));

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Helper functions for test setup
const mockPreferences = [
  {
    id: 'pref-1',
    user_id: 'user-123',
    notification_type: 'lesson_reminder_24h' as NotificationType,
    enabled: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'pref-2',
    user_id: 'user-123',
    notification_type: 'lesson_recap' as NotificationType,
    enabled: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockAuthUser = (userId: string | null) => {
  mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
    data: { user: userId ? { id: userId } : null },
  });
};

const mockPreferencesQuery = (data: unknown, error: unknown = null) => {
  const mockSelect = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockOrder = jest.fn().mockResolvedValueOnce({ data, error });

  mockSupabaseClient.from.mockReturnValueOnce({
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
  });

  return { mockSelect, mockEq, mockOrder };
};

const mockProfileQuery = (role: string | null) => {
  const mockSelect = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockSingle = jest.fn().mockResolvedValueOnce({
    data: role ? { role } : null,
    error: null,
  });

  mockSupabaseClient.from.mockReturnValueOnce({
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
  });
};

const mockUpdateQuery = (error: unknown = null) => {
  const mockUpdate = jest.fn().mockReturnThis();
  const mockEq1 = jest.fn().mockReturnThis();
  const mockEq2 = jest.fn().mockResolvedValueOnce({ error });

  mockSupabaseClient.from.mockReturnValueOnce({
    update: mockUpdate,
    eq: mockEq1,
  });

  mockEq1.mockReturnValueOnce({ eq: mockEq2 });

  return { mockUpdate, mockEq1, mockEq2 };
};

const mockBulkUpdateQuery = (error: unknown = null) => {
  const mockUpdate = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockResolvedValueOnce({ error });

  mockSupabaseClient.from.mockReturnValueOnce({
    update: mockUpdate,
    eq: mockEq,
  });

  return { mockUpdate, mockEq };
};

describe('notification-preferences actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserNotificationPreferences', () => {

    it('should fetch preferences for authenticated user requesting their own preferences', async () => {
      mockAuthUser('user-123');
      const { mockSelect, mockEq, mockOrder } = mockPreferencesQuery(mockPreferences);

      const result = await getUserNotificationPreferences('user-123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notification_preferences');
      expect(mockSelect).toHaveBeenCalledWith('id, user_id, notification_type, enabled, delivery_channel, created_at, updated_at');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockOrder).toHaveBeenCalledWith('notification_type', { ascending: true });
      expect(result).toEqual({ success: true, data: mockPreferences });
    });

    it('should allow admin to fetch another users preferences', async () => {
      mockAuthUser('admin-123');
      mockProfileQuery('admin');
      mockPreferencesQuery(mockPreferences);

      const result = await getUserNotificationPreferences('user-123');

      expect(result).toEqual({ success: true, data: mockPreferences });
    });

    it('should deny non-admin user from fetching another users preferences', async () => {
      mockAuthUser('user-456');
      mockProfileQuery('student');

      const result = await getUserNotificationPreferences('user-123');

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized: Cannot access other users preferences',
      });
    });

    it('should deny access when profile fetch fails', async () => {
      mockAuthUser('user-456');
      mockProfileQuery(null);

      const result = await getUserNotificationPreferences('user-123');

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized: Cannot access other users preferences',
      });
    });

    it('should return unauthorized when user is not authenticated', async () => {
      mockAuthUser(null);

      const result = await getUserNotificationPreferences('user-123');

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockAuthUser('user-123');
      mockPreferencesQuery(null, { message: 'Database error' });

      const result = await getUserNotificationPreferences('user-123');

      expect(result).toEqual({
        success: false,
        error: 'Failed to fetch notification preferences',
      });
    });
  });

  describe('updateNotificationPreference', () => {
    it('should update preference when user updates their own preference', async () => {
      mockAuthUser('user-123');
      const { mockUpdate, mockEq1, mockEq2 } = mockUpdateQuery();

      const result = await updateNotificationPreference(
        'user-123',
        'lesson_reminder_24h',
        false
      );

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notification_preferences');
      expect(mockUpdate).toHaveBeenCalledWith({ enabled: false });
      expect(mockEq1).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockEq2).toHaveBeenCalledWith('notification_type', 'lesson_reminder_24h');
      expect(result).toEqual({ success: true });
    });

    it('should enable a previously disabled preference', async () => {
      mockAuthUser('user-123');
      const { mockUpdate } = mockUpdateQuery();

      const result = await updateNotificationPreference(
        'user-123',
        'weekly_progress_digest',
        true
      );

      expect(mockUpdate).toHaveBeenCalledWith({ enabled: true });
      expect(result).toEqual({ success: true });
    });

    it('should deny user from updating another users preference', async () => {
      mockAuthUser('user-456');

      const result = await updateNotificationPreference(
        'user-123',
        'lesson_reminder_24h',
        false
      );

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized: Cannot modify other users preferences',
      });
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return unauthorized when user is not authenticated', async () => {
      mockAuthUser(null);

      const result = await updateNotificationPreference(
        'user-123',
        'lesson_reminder_24h',
        false
      );

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockAuthUser('user-123');
      mockUpdateQuery({ message: 'Update failed' });

      const result = await updateNotificationPreference(
        'user-123',
        'lesson_reminder_24h',
        false
      );

      expect(result).toEqual({
        success: false,
        error: 'Failed to update notification preference',
      });
    });

    it('should handle various notification types', async () => {
      const types: NotificationType[] = [
        'lesson_reminder_24h',
        'assignment_created',
        'teacher_daily_summary',
      ];

      for (const type of types) {
        jest.clearAllMocks();
        mockAuthUser('user-123');
        const { mockEq2 } = mockUpdateQuery();

        const result = await updateNotificationPreference('user-123', type, true);

        expect(mockEq2).toHaveBeenCalledWith('notification_type', type);
        expect(result).toEqual({ success: true });
      }
    });
  });

  describe('updateAllNotificationPreferences', () => {
    it('should enable all preferences for user', async () => {
      mockAuthUser('user-123');
      const { mockUpdate, mockEq } = mockBulkUpdateQuery();

      const result = await updateAllNotificationPreferences('user-123', true);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('notification_preferences');
      expect(mockUpdate).toHaveBeenCalledWith({ enabled: true });
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(result).toEqual({ success: true });
    });

    it('should disable all preferences for user', async () => {
      mockAuthUser('user-123');
      const { mockUpdate } = mockBulkUpdateQuery();

      const result = await updateAllNotificationPreferences('user-123', false);

      expect(mockUpdate).toHaveBeenCalledWith({ enabled: false });
      expect(result).toEqual({ success: true });
    });

    it('should deny user from updating another users preferences', async () => {
      mockAuthUser('user-456');

      const result = await updateAllNotificationPreferences('user-123', true);

      expect(result).toEqual({
        success: false,
        error: 'Unauthorized: Cannot modify other users preferences',
      });
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should return unauthorized when user is not authenticated', async () => {
      mockAuthUser(null);

      const result = await updateAllNotificationPreferences('user-123', true);

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockAuthUser('user-123');
      mockBulkUpdateQuery({ message: 'Bulk update failed' });

      const result = await updateAllNotificationPreferences('user-123', true);

      expect(result).toEqual({
        success: false,
        error: 'Failed to update all notification preferences',
      });
    });

    it('should toggle from all enabled to all disabled', async () => {
      mockAuthUser('user-123');
      const { mockUpdate: mockUpdate1 } = mockBulkUpdateQuery();

      const result1 = await updateAllNotificationPreferences('user-123', true);
      expect(result1).toEqual({ success: true });
      expect(mockUpdate1).toHaveBeenCalledWith({ enabled: true });

      mockAuthUser('user-123');
      const { mockUpdate: mockUpdate2 } = mockBulkUpdateQuery();

      const result2 = await updateAllNotificationPreferences('user-123', false);
      expect(result2).toEqual({ success: true });
      expect(mockUpdate2).toHaveBeenCalledWith({ enabled: false });
    });
  });
});
