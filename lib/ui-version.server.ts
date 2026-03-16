import { cookies } from 'next/headers';
import { COOKIE_NAME, DEFAULT_VERSION } from './ui-version';
import type { UIVersion } from './ui-version';

/**
 * Server-side: read UI version from cookie (RSC / Server Actions / Route Handlers).
 */
export async function getUIVersion(): Promise<UIVersion> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  return raw === 'v2' ? 'v2' : DEFAULT_VERSION;
}
