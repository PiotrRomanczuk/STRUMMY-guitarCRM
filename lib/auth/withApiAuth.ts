import 'server-only';
import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import {
  loadAuthedProfile,
  hasRole,
  type AuthedProfile,
  type Role,
} from '@/lib/auth/loadAuthedProfile';
import { generateRequestId, runWithRequestContext } from '@/lib/logger';

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
  // Prefer a platform-provided request id when available (Vercel sets
  // `x-vercel-id`; some setups use `x-request-id`); otherwise generate.
  const requestId =
    request.headers.get('x-request-id') ??
    request.headers.get('x-vercel-id') ??
    generateRequestId();

  return runWithRequestContext({ requestId }, async () => {
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

    // Now that we have user identity, enrich the request scope so any
    // downstream log line inside the handler picks up userId + role.
    return runWithRequestContext(
      { requestId, userId: authed.user.id, role: primaryRole(authed) },
      () => handler(authed, request)
    );
  });
}

function primaryRole(authed: AuthedProfile): string | undefined {
  if (authed.roles.isAdmin) return 'admin';
  if (authed.roles.isTeacher) return 'teacher';
  if (authed.roles.isStudent) return 'student';
  return undefined;
}
