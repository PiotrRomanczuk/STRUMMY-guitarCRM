import { NextResponse } from 'next/server';
import { withApiAuthMFA } from '@/lib/auth/withApiAuthMFA';

/**
 * GET /api/admin/aal-status
 *
 * Reports the current authenticator-assurance-level of the calling session.
 * Demonstrates the `withApiAuthMFA` wrapper in production use:
 *   - aal2 sessions get 200 with their roles.
 *   - aal1 sessions whose user has MFA enrolled get 401 `mfa_required`.
 *   - Sessions with no MFA enrollment get 200 (the gate is a no-op).
 *
 * Locks `auth:mfa-bypass-impossible` for an actual deployed route — any
 * other admin route can opt in by swapping `withApiAuth` for
 * `withApiAuthMFA` once the MFA challenge UX is confirmed wired up.
 */
export async function GET(request: Request) {
  return withApiAuthMFA(request, async ({ user, roles, flags }) =>
    NextResponse.json(
      {
        userId: user.id,
        roles,
        flags,
        aal: 'aal2',
      },
      { status: 200 }
    )
  );
}
