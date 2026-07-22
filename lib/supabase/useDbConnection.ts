'use client';

import { useSyncExternalStore } from 'react';
import { getSupabaseConfig } from './config';

export type DbKind = 'dev' | 'prod' | 'preview' | 'other';

export interface DbInfo {
  kind: DbKind;
  label: string;
  host: string;
}

// Mirror lib/supabase/client.ts: it honours the sb-provider-preference cookie,
// so this must too — otherwise the UI can disagree with the real client target.
function compute(): DbInfo | null {
  let forceRemote = false;
  const match = document.cookie.match(/(^| )sb-provider-preference=([^;]+)/);
  if (match && match[2] === 'remote') forceRemote = true;

  const { url, isLocal } = getSupabaseConfig({ forceRemote });
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    // keep raw url as fallback host
  }

  if (isLocal || /localhost|127\.0\.0\.1|(^|\.)192\.168\.|(^|\.)10\.|\.local(:|$)/.test(host)) {
    return { kind: 'dev', label: 'Development', host };
  }
  if (/supabase\.co|marszal-arts\.online/.test(host)) {
    return { kind: 'prod', label: 'Production', host };
  }
  if (/vercel\.app|preview/.test(host)) {
    return { kind: 'preview', label: 'Preview', host };
  }
  return { kind: 'other', label: 'Remote', host };
}

// Cache so getSnapshot returns a stable reference (useSyncExternalStore compares
// by identity — recomputing a fresh object each call would loop infinitely).
let cached: DbInfo | null | undefined;
function getClientSnapshot(): DbInfo | null {
  if (cached === undefined) {
    try {
      cached = compute();
    } catch {
      cached = null;
    }
  }
  return cached;
}

const subscribe = () => () => {};
const getServerSnapshot = (): DbInfo | null => null;

/** Which Supabase database the browser client is currently pointed at. Null on the server. */
export function useDbConnection(): DbInfo | null {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
