export type UIVersion = 'v1' | 'v2' | 'v3';

export const COOKIE_NAME = 'strummy-ui-version';
export const DEFAULT_VERSION: UIVersion = 'v2';

/**
 * Client-side: read UI version cookie from document.cookie.
 */
export function getUIVersionFromCookie(): UIVersion {
  if (typeof document === 'undefined') return DEFAULT_VERSION;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  const value = match?.[1];
  if (value === 'v1' || value === 'v2' || value === 'v3') return value;
  return DEFAULT_VERSION;
}

/**
 * Client-side: set UI version cookie (1-year expiry, SameSite=Lax).
 */
export function setUIVersionCookie(version: UIVersion): void {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${version};path=/;max-age=${maxAge};SameSite=Lax`;
}
