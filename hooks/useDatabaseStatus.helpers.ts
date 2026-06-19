import type { DatabaseType } from './useDatabaseStatus.types';

const COOKIE_NAME = 'sb-provider-preference';
const COOKIE_MAX_AGE = 31536000; // 1 year

/** Get current database preference from cookie. */
export function getPreferenceFromCookie(): DatabaseType {
  if (typeof document === 'undefined') return 'local';
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`));
  return match && match[2] === 'remote' ? 'remote' : 'local';
}

/** Set database preference cookie. */
export function setPreferenceCookie(type: DatabaseType): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${type}; path=/; max-age=${COOKIE_MAX_AGE}`;
}

/** Return an error message if the requested type is not available, null if ok. */
export function checkAvailability(
  type: DatabaseType,
  localAvailable: boolean,
  remoteAvailable: boolean
): string | null {
  if (type === 'local' && !localAvailable) return 'Local database configuration not available';
  if (type === 'remote' && !remoteAvailable) return 'Remote database configuration not available';
  return null;
}

/** Build the fallback status object when the API is unreachable. */
export function buildFallbackStatus(cookiePref: DatabaseType, errorMessage: string) {
  return {
    type: cookiePref,
    url: '',
    isLocal: cookiePref === 'local',
    source: 'cookie' as const,
    localAvailable: !!process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL,
    remoteAvailable: !!(
      process.env.NEXT_PUBLIC_SUPABASE_REMOTE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    ),
    isConnected: false,
    error: errorMessage,
  };
}
