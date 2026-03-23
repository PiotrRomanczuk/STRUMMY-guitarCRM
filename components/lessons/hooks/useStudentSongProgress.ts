'use client';

import { useEffect, useState } from 'react';
import {
  getStudentSongProgressAction,
  type SongProgressMap,
} from '@/app/actions/repertoire';

/**
 * Fetches a student's song progress from their repertoire.
 * Returns a map of songId -> { current_status, last_practiced_at, total_practice_minutes, self_rating }.
 * Re-fetches when studentId changes.
 */
export function useStudentSongProgress(studentId: string | undefined) {
  const [progressMap, setProgressMap] = useState<SongProgressMap>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setProgressMap({});
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getStudentSongProgressAction(studentId)
      .then((result) => {
        if (cancelled) return;
        if ('progressMap' in result) {
          setProgressMap(result.progressMap);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  return { progressMap, isLoading };
}
