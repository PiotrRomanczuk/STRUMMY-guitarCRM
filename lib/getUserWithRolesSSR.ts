import { createClient } from '@/lib/supabase/server';
import { loadAuthedProfile } from '@/lib/auth/loadAuthedProfile';

/**
 * Server Component / Server Action adapter for the auth seam.
 *
 * Resolves the cookie-bound user and loads their Profile via the shared loader
 * (`loadAuthedProfile`), which is memoized per request. Returns a flat shape
 * with the empty-roles default when there is no user or no Profile, so existing
 * callers that destructure `{ user, isAdmin, ... }` keep working.
 *
 * For new code, prefer `loadAuthedProfile(user)` directly.
 */
export async function getUserWithRolesSSR() {
  const empty = {
    user: null,
    isAdmin: false,
    isTeacher: false,
    isStudent: false,
    isParent: false,
    isDevelopment: false,
  };

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return empty;

  const authed = await loadAuthedProfile(user);
  if (!authed) {
    return { ...empty, user };
  }

  return {
    user: authed.user,
    isAdmin: authed.roles.isAdmin,
    isTeacher: authed.roles.isTeacher,
    isStudent: authed.roles.isStudent,
    isParent: authed.flags.isParent,
    isDevelopment: authed.flags.isDevelopment,
  };
}
