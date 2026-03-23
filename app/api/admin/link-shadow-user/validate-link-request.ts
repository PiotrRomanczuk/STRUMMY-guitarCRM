import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';

const linkShadowUserSchema = z.object({
  shadowProfileId: z.string().uuid('shadowProfileId must be a valid UUID'),
  realUserId: z.string().uuid('realUserId must be a valid UUID'),
});

export type LinkShadowUserRequest = z.infer<typeof linkShadowUserSchema>;

interface ShadowProfile {
  id: string;
  email: string;
  full_name: string | null;
  is_shadow: boolean;
}

interface ValidationSuccess {
  shadowProfile: ShadowProfile;
  realUserEmail: string;
  shadowProfileId: string;
  realUserId: string;
  errorResponse?: never;
}

interface ValidationFailure {
  errorResponse: NextResponse;
  shadowProfile?: never;
  realUserEmail?: never;
  shadowProfileId?: never;
  realUserId?: never;
}

type ValidationResult = ValidationSuccess | ValidationFailure;

/** Parse and validate the request body against the Zod schema. */
type ParseSuccess = { data: LinkShadowUserRequest; errorResponse?: never };
type ParseFailure = { errorResponse: NextResponse; data?: never };

export function parseBody(body: unknown): ParseSuccess | ParseFailure {
  const parsed = linkShadowUserSchema.safeParse(body);
  if (!parsed.success) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      ),
    };
  }
  return { data: parsed.data };
}

/**
 * Run all precondition checks for linking a shadow user:
 *  - Shadow profile exists and is_shadow = true
 *  - Real user exists in auth.users
 *  - Real user does not already have a profile
 */
export async function validatePreconditions(
  supabase: SupabaseClient,
  shadowProfileId: string,
  realUserId: string
): Promise<ValidationResult> {
  // 1. Verify shadow profile exists and is_shadow = true
  const { data: shadowProfile, error: shadowError } = await supabase
    .from('profiles')
    .select('id, email, full_name, is_shadow')
    .eq('id', shadowProfileId)
    .single();

  if (shadowError || !shadowProfile) {
    return { errorResponse: NextResponse.json({ error: 'Shadow profile not found' }, { status: 404 }) };
  }

  if (!shadowProfile.is_shadow) {
    return { errorResponse: NextResponse.json({ error: 'Profile is not a shadow profile' }, { status: 400 }) };
  }

  // 2. Verify real user exists in auth.users
  const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(
    realUserId
  );

  if (authUserError || !authUser?.user) {
    return { errorResponse: NextResponse.json({ error: 'Real user not found in auth.users' }, { status: 404 }) };
  }

  // 3. Verify real user doesn't already have a profile
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', realUserId)
    .maybeSingle();

  if (existingProfile) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Real user already has a profile. Cannot link.' },
        { status: 409 }
      ),
    };
  }

  return {
    shadowProfile: shadowProfile as ShadowProfile,
    realUserEmail: authUser.user.email ?? shadowProfile.email,
    shadowProfileId,
    realUserId,
  };
}
