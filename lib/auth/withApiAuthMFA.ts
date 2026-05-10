import 'server-only';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth, type ApiAuthedHandler, type WithApiAuthOptions } from './withApiAuth';

/**
 * MFA-aware auth wrapper. Wraps `withApiAuth` and adds an aal2 gate on top:
 *
 *   1. Standard auth (cookie OR API key) via withApiAuth.
 *   2. If the caller has MFA enrolled (nextLevel === 'aal2') AND the current
 *      session has only verified the password (currentLevel === 'aal1'),
 *      return 401 with `mfa_required` so the client can route to the MFA
 *      challenge UI.
 *
 * This is OPT-IN — existing routes that use `withApiAuth` are unchanged.
 * Switch a route to this wrapper only after confirming the MFA-challenge UX
 * is wired up; otherwise users with enrolled MFA will be hard-locked out.
 *
 * API-key-authenticated callers (no Supabase session) bypass the gate by
 * design: the API key already represents an out-of-band trusted credential.
 *
 * Closes `auth:mfa-bypass-impossible` for any route that opts in.
 *
 * @example
 *   export async function POST(request: Request) {
 *     return withApiAuthMFA(request, async (authed) => {
 *       // ... privileged operation, only reachable from an aal2 session
 *     });
 *   }
 */
export async function withApiAuthMFA(
  request: Request,
  handler: ApiAuthedHandler,
  options?: WithApiAuthOptions
): Promise<Response | NextResponse> {
  return withApiAuth(
    request,
    async (authed, req) => {
      // API-key auth bypasses the MFA gate. The convention: API keys are
      // Bearer-token-prefixed (`sk_live_…`); cookie-only callers do not have
      // an Authorization header.
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.toLowerCase().startsWith('bearer ')) {
        return handler(authed, req);
      }

      const supabase = await createClient();
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (error) {
        return NextResponse.json({ error: 'Failed to verify MFA status' }, { status: 500 });
      }

      // MFA is enrolled when nextLevel is 'aal2'. If currentLevel is below
      // that, the session has not completed the challenge.
      if (data?.nextLevel === 'aal2' && data?.currentLevel !== 'aal2') {
        return NextResponse.json(
          { error: 'MFA verification required', code: 'mfa_required' },
          { status: 401 }
        );
      }

      return handler(authed, req);
    },
    options
  );
}
