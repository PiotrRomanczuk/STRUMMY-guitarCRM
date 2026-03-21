'use client';

import { useCallback, useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Auto-refreshes the lesson list when the tab regains focus after being
 * hidden for longer than STALE_THRESHOLD_MS. Also exposes a manual
 * refresh function and loading state.
 */
export function useLessonRefresh() {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const lastVisibleAt = useRef(0);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
    lastVisibleAt.current = Date.now();
  }, [router]);

  useEffect(() => {
    // Initialize on mount (inside effect to avoid impure render call)
    lastVisibleAt.current = Date.now();

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        lastVisibleAt.current = Date.now();
        return;
      }

      // Tab just became visible — check staleness
      const elapsed = Date.now() - lastVisibleAt.current;
      if (elapsed >= STALE_THRESHOLD_MS) {
        refresh();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refresh]);

  return { refresh, isRefreshing };
}
