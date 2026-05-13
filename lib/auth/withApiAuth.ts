import 'server-only';
import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import {
  loadAuthedProfile,
  hasRole,
  type AuthedProfile,
  type Role,
} from '@/lib/auth/loadAuthedProfile';

export type WithApiAuthOptions = {
  requiredRole?: Role;
};

export type ApiAuthedHandler = (
  authed: AuthedProfile,
  request: Request
) => Promise<Response | NextResponse>;

/**
 * Standard auth wrapper for API route handlers.
 *
 * - Resolves cookie session OR API key bearer token via `authenticateRequest`.
 * - Loads the authenticated user's Profile (roles + flags) once, memoized per request.
 * - Returns 401 if unauthenticated, 403 if authed-but-no-Profile or missing required role.
 * - Hands `(authed, request)` to the handler.
 *
 * @example
 * export async function GET(request: Request) {
 *   return withApiAuth(request, async ({ user, roles, flags }) => {
 *     // ...
 *     return NextResponse.json({ ok: true });
 *   });
 * }
 *
 * @example admin-only
 * export async function POST(request: Request) {
 *   return withApiAuth(request, handler, { requiredRole: 'admin' });
 * }
 */
export async function withApiAuth(
  request: Request,
  handler: ApiAuthedHandler,
  options?: WithApiAuthOptions
): Promise<Response | NextResponse> {
  const auth = await authenticateRequest(request);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  const authed = await loadAuthedProfile(auth.user);
  if (!authed) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 403 });
  }

  if (options?.requiredRole && !hasRole(authed.roles, options.requiredRole)) {
    return NextResponse.json(
      { error: `Forbidden. ${options.requiredRole} role required.` },
      { status: 403 }
    );
  }

  return handler(authed, request);
}
