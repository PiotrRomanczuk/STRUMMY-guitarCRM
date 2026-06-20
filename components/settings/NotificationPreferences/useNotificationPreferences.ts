'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getUserNotificationPreferences,
  updateNotificationPreference,
  updateAllNotificationPreferences,
} from '@/app/actions/notification-preferences';
import { NotificationPreference, NotificationType } from '@/types/notifications';

interface UseNotificationPreferencesReturn {
  preferences: NotificationPreference[];
  isLoading: boolean;
  error: string | null;
  togglePreference: (type: NotificationType, enabled: boolean) => Promise<void>;
  toggleAll: (enabled: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing notification preferences.
 * userId is supplied by the parent RSC to avoid a dependency on the removed AuthProvider.
 */
export function useNotificationPreferences(userId: string): UseNotificationPreferencesReturn {
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserNotificationPreferences(userId);

      if (result.success && result.data) {
        setPreferences(result.data);
      } else {
        setError(result.error || 'Failed to load preferences');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const togglePreference = async (type: NotificationType, enabled: boolean) => {
    // Optimistic update
    setPreferences((prev) =>
      prev.map((p) => (p.notification_type === type ? { ...p, enabled } : p))
    );

    try {
      const result = await updateNotificationPreference(userId, type, enabled);

      if (!result.success) {
        // Revert on error
        setPreferences((prev) =>
          prev.map((p) => (p.notification_type === type ? { ...p, enabled: !enabled } : p))
        );
        setError(result.error || 'Failed to update preference');
      }
    } catch (err) {
      // Revert on error
      setPreferences((prev) =>
        prev.map((p) => (p.notification_type === type ? { ...p, enabled: !enabled } : p))
      );
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  const toggleAll = async (enabled: boolean) => {
    // Optimistic update
    const previousPreferences = [...preferences];
    setPreferences((prev) => prev.map((p) => ({ ...p, enabled })));

    try {
      const result = await updateAllNotificationPreferences(userId, enabled);

      if (!result.success) {
        // Revert on error
        setPreferences(previousPreferences);
        setError(result.error || 'Failed to update preferences');
      }
    } catch (err) {
      // Revert on error
      setPreferences(previousPreferences);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  const refresh = async () => {
    await fetchPreferences();
  };

  return {
    preferences,
    isLoading,
    error,
    togglePreference,
    toggleAll,
    refresh,
  };
}
