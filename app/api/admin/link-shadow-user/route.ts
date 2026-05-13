import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createLogger } from '@/lib/logger';
import { parseBody, validatePreconditions } from './validate-link-request';
import { transferShadowReferences } from './transfer-shadow-references';

const log = createLogger('link-shadow-user');

/**
 * POST /api/admin/link-shadow-user
 *
 * Links an orphaned shadow profile to a real authenticated user.
 * Transfers all FK references (lessons, assignments, etc.) from the
 * shadow profile to the real user, then deletes the shadow profile.
 *
 * Requires admin or teacher role.
 */
export async function POST(request: Request) {
  return withApiAuth(request, async ({ roles }) => {
    if (!roles.isAdmin && !roles.isTeacher) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Parse and validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = parseBody(body);
    if (parsed.errorResponse) return parsed.errorResponse;
    const { shadowProfileId, realUserId } = parsed.data;

    // Validate preconditions (shadow exists, real user exists, no dup)
    const validation = await validatePreconditions(supabase, shadowProfileId, realUserId);
    if (validation.errorResponse) return validation.errorResponse;

    // Transfer FK references and swap the profile
    try {
      const result = await transferShadowReferences(
        supabase,
        shadowProfileId,
        realUserId,
        validation.shadowProfile,
        validation.realUserEmail
      );

      log.info('Shadow profile linked successfully', {
        shadowProfileId,
        realUserId,
        transferred: result.counts,
      });

      return NextResponse.json(
        { profile: result.updatedProfile, transferred: result.counts },
        { status: 200 }
      );
    } catch (error) {
      log.error('Failed to link shadow user', error, { shadowProfileId, realUserId });
      const message = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ error: `Transfer failed: ${message}` }, { status: 500 });
    }
  });
}
