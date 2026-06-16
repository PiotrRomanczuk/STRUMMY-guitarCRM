/**
 * Env discovery for RLS-real integration tests.
 *
 * These tests require:
 *  - A reachable Supabase instance (local on 127.0.0.1:54321 by default, OR a
 *    dedicated Supabase **branch** DB in CI — never production).
 *  - The service-role key for seeding.
 *  - The anon key for signing in as a user (RLS-real client).
 *
 * If any of these are missing we expose `isRlsTestEnvAvailable() === false`,
 * which the test harness uses to skip the suite gracefully — so contributors
 * without a local DB don't see red CI noise.
 *
 * ## Pointing the suite at a Supabase branch (Phase 0.5 / spec 11A.5)
 *
 * The RLS tests SEED and DELETE auth users, so they must target a throwaway
 * branch DB, never `zmlluqqqwrfhygvpfqka` (prod). To run them, Piotr/CI must
 * set the **dedicated** `RLS_TEST_*` env vars (preferred over the generic
 * `NEXT_PUBLIC_SUPABASE_*` so the suite can't accidentally inherit a prod URL):
 *
 *   RLS_TEST_SUPABASE_URL=https://<branch-ref>.supabase.co
 *   RLS_TEST_SERVICE_ROLE_KEY=<branch service_role key>
 *   RLS_TEST_ANON_KEY=<branch anon key>
 *
 * A hard guard below refuses to run against the known production project ref.
 */

/** Production project ref — the RLS suite must NEVER seed/delete against it. */
const PROD_PROJECT_REF = 'zmlluqqqwrfhygvpfqka';

export type RlsEnv = {
  supabaseUrl: string;
  serviceRoleKey: string;
  anonKey: string;
};

export function readRlsEnv(): RlsEnv | null {
  const supabaseUrl =
    process.env.RLS_TEST_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'http://127.0.0.1:54321';

  const serviceRoleKey =
    process.env.RLS_TEST_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY ||
    '';

  const anonKey =
    process.env.RLS_TEST_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  if (!serviceRoleKey || !anonKey) return null;

  // Hard safety guard: never run the destructive RLS seed against production.
  if (supabaseUrl.includes(PROD_PROJECT_REF)) {
    throw new Error(
      `RLS tests refuse to run against the production project (${PROD_PROJECT_REF}). ` +
        'Set RLS_TEST_SUPABASE_URL to a Supabase branch DB instead.'
    );
  }

  return { supabaseUrl, serviceRoleKey, anonKey };
}

export function isRlsTestEnvAvailable(): boolean {
  return readRlsEnv() !== null;
}

/**
 * Jest helper: returns describe / describe.skip depending on env availability.
 * Lets every RLS suite open with `describeIfRls('...', () => { ... })`.
 */
export const describeIfRls: jest.Describe = (
  isRlsTestEnvAvailable() ? describe : describe.skip
) as jest.Describe;
