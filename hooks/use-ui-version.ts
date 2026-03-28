'use client';

import { useState, useCallback } from 'react';
import type { UIVersion } from '@/lib/ui-version';
import { getUIVersionFromCookie, setUIVersionCookie } from '@/lib/ui-version';

interface UseUIVersionReturn {
  version: UIVersion;
  setVersion: (v: UIVersion) => void;
  toggle: () => void;
  pending: boolean;
}

/**
 * Client hook to read and toggle the v1/v2 UI version cookie.
 * Triggers a page reload on change so server components re-render.
 */
export function useUIVersion(): UseUIVersionReturn {
  const [version, setVersionState] = useState<UIVersion>(() => getUIVersionFromCookie());
  const [pending, setPending] = useState(false);

  // Sync with cookie on mount (handles SSR mismatch)
  // Uses React's "adjust state during render" pattern instead of effect
  const cookieValue = getUIVersionFromCookie();
  if (cookieValue !== version) {
    setVersionState(cookieValue);
  }

  const setVersion = useCallback((v: UIVersion) => {
    setPending(true);
    setUIVersionCookie(v);
    setVersionState(v);
    window.location.reload();
  }, []);

  const toggle = useCallback(() => {
    const current = getUIVersionFromCookie();
    const next: UIVersion = current === 'v1' ? 'v2' : current === 'v2' ? 'v3' : 'v1';
    setVersion(next);
  }, [setVersion]);

  return { version, setVersion, toggle, pending };
}
