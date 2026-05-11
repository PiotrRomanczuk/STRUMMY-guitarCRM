/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Test seed helper.
 *
 * Idempotently provisions the seed accounts and shadow profile that the E2E
 * suite expects. Safe to call from `globalSetup` and again from individual
 * specs — every operation is "create if not exists."
 *
 * Wires into the existing seed credentials (TEST_{ADMIN,TEACHER,STUDENT}_*) so
 * the suite shares users with the cypress / dev seed.
 *
 * Local Supabase is required. The helper fails loud if the service-role key
 * is missing rather than silently using anon access.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

function localSupabaseUp(): boolean {
  try {
    execSync('nc -z 127.0.0.1 54321 2>/dev/null', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

function getAdminClient(): SupabaseClient {
  const isLocal = !!process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL && localSupabaseUp();
  const url = isLocal
    ? process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL!
    : process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = isLocal
    ? process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      '[seed] Missing Supabase URL or service-role key. Set NEXT_PUBLIC_SUPABASE_LOCAL_URL + SUPABASE_LOCAL_SERVICE_ROLE_KEY for local, or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY for remote.'
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface SeedAccount {
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'teacher' | 'student';
}

const SEED_ACCOUNTS: SeedAccount[] = [
  {
    email: process.env.TEST_ADMIN_EMAIL || 'p.romanczuk@gmail.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'test123_admin',
    fullName: 'E2E Admin',
    role: 'admin',
  },
  {
    email: process.env.TEST_TEACHER_EMAIL || 'teacher@example.com',
    password: process.env.TEST_TEACHER_PASSWORD || 'test123_teacher',
    fullName: 'E2E Teacher',
    role: 'teacher',
  },
  {
    email: process.env.TEST_STUDENT_EMAIL || 'student@example.com',
    password: process.env.TEST_STUDENT_PASSWORD || 'test123_student',
    fullName: 'E2E Student',
    role: 'student',
  },
];

async function ensureAuthUser(admin: SupabaseClient, acct: SeedAccount): Promise<string> {
  // Try to find existing user.
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u: any) => u.email === acct.email);
  if (existing) return existing.id;

  const { data, error } = await admin.auth.admin.createUser({
    email: acct.email,
    password: acct.password,
    email_confirm: true,
    user_metadata: { full_name: acct.fullName, role: acct.role },
  });
  if (error || !data.user) {
    throw new Error(`[seed] Failed to create ${acct.email}: ${error?.message ?? 'no user'}`);
  }
  return data.user.id;
}

async function ensureProfile(
  admin: SupabaseClient,
  userId: string,
  acct: SeedAccount
): Promise<void> {
  await admin.from('profiles').upsert(
    {
      id: userId,
      user_id: userId,
      email: acct.email,
      full_name: acct.fullName,
      is_admin: acct.role === 'admin',
      is_teacher: acct.role === 'teacher' || acct.role === 'admin',
      is_student: acct.role === 'student',
      is_shadow: false,
      is_active: true,
    },
    { onConflict: 'id' }
  );
}

/**
 * Seed all required accounts. Returns a record keyed by role with the user
 * ids — useful for specs that need to build cross-role test data.
 */
export async function seedTestAccounts(): Promise<Record<string, string>> {
  const admin = getAdminClient();
  const ids: Record<string, string> = {};
  for (const acct of SEED_ACCOUNTS) {
    const uid = await ensureAuthUser(admin, acct);
    await ensureProfile(admin, uid, acct);
    ids[acct.role] = uid;
  }
  return ids;
}

/**
 * Create a shadow profile with a known `invite_email`. Used by:
 *  - `tests/e2e/auth/accept-invitation.spec.ts`
 *  - `tests/e2e/integration/shadow-to-real-link.spec.ts`
 *  - `tests/e2e/teacher/users-invite.spec.ts`
 *
 * Returns the new shadow profile id. Idempotent on `invite_email`.
 */
export async function ensureShadowProfile(opts: {
  invite_email: string;
  full_name: string;
  teacher_id?: string;
}): Promise<string> {
  const admin = getAdminClient();
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('invite_email', opts.invite_email)
    .eq('is_shadow', true)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await admin
    .from('profiles')
    .insert({
      email: `shadow_${crypto.randomUUID()}@placeholder.com`,
      invite_email: opts.invite_email,
      full_name: opts.full_name,
      is_shadow: true,
      is_student: true,
      is_teacher: false,
      is_admin: false,
      is_active: true,
      user_id: null,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`[seed] Failed to create shadow profile: ${error?.message ?? 'no row'}`);
  }
  return data.id;
}
