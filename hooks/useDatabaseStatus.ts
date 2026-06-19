'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  DatabaseType,
  DatabaseStatusState,
  UseDatabaseStatusReturn,
} from './useDatabaseStatus.types';
import {
  getPreferenceFromCookie,
  setPreferenceCookie,
  buildFallbackStatus,
  checkAvailability,
} from './useDatabaseStatus.helpers';

export type { DatabaseType, DatabaseStatusState, UseDatabaseStatusReturn };

/**
 * Hook for accessing and managing database connection status.
 * ```tsx
 * const { isLocal, type, toggleDatabase, testConnection } = useDatabaseStatus();
 * ```
 */
export function useDatabaseStatus(): UseDatabaseStatusReturn {
  const [status, setStatus] = useState<DatabaseStatusState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/database/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`Failed to fetch database status: ${response.statusText}`);
      const data = await response.json();
      setStatus({
        type: data.database.type,
        url: data.database.url,
        isLocal: data.database.isLocal,
        source: data.database.source,
        localAvailable: data.availability.localAvailable,
        remoteAvailable: data.availability.remoteAvailable,
        isConnected: data.success,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setStatus(buildFallbackStatus(getPreferenceFromCookie(), msg));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/database/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      setStatus((prev) => ({
        ...prev!,
        isConnected: data.connection?.isConnected ?? false,
        latency: data.connection?.latency,
        error: data.connection?.error,
      }));
      return data.connection?.isConnected ?? false;
    } catch {
      return false;
    }
  }, []);

  const toggleDatabase = useCallback(() => {
    const newType: DatabaseType =
      (status?.type ?? getPreferenceFromCookie()) === 'local' ? 'remote' : 'local';
    const availError = checkAvailability(
      newType,
      status?.localAvailable ?? false,
      status?.remoteAvailable ?? false
    );
    if (availError) {
      setError(availError);
      return;
    }
    setPreferenceCookie(newType);
    window.location.reload();
  }, [status]);

  const switchTo = useCallback(
    (type: DatabaseType) => {
      const availError = checkAvailability(
        type,
        status?.localAvailable ?? false,
        status?.remoteAvailable ?? false
      );
      if (availError) {
        setError(availError);
        return;
      }
      if (status?.type === type) return;
      setPreferenceCookie(type);
      window.location.reload();
    },
    [status]
  );

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return {
    type: status?.type ?? 'local',
    isLocal: status?.isLocal ?? true,
    status,
    isLoading,
    error,
    toggleDatabase,
    switchTo,
    testConnection,
    refresh: fetchStatus,
  };
}

export default useDatabaseStatus;
