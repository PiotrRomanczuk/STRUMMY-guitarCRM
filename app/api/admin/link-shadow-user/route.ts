import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateRequest } from '@/lib/auth/api-auth';
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
  // 1. Authenticate
  const auth = await authenticateRequest(request);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = createAdminClient();

  // 2. Check role (admin or teacher)
  const roleCheck = await checkAdminOrTeacher(supabase, auth.user.id);
  if (roleCheck) return roleCheck;

  // 3. Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (parsed.errorResponse) return parsed.errorResponse;
  const { shadowProfileId, realUserId } = parsed.data;

  // 4. Validate preconditions (shadow exists, real user exists, no dup)
  const validation = await validatePreconditions(supabase, shadowProfileId, realUserId);
  if (validation.errorResponse) return validation.errorResponse;

  // 5. Transfer FK references and swap the profile
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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function checkAdminOrTeacher(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<NextResponse | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin, is_teacher')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (!profile.is_admin && !profile.is_teacher) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}
