/**
 * Env discovery for RLS-real integration tests.
 *
 * These tests require:
 *  - A reachable Supabase instance (local on 127.0.0.1:54321 by default).
 *  - The service-role key for seeding.
 *  - The anon key for signing in as a user (RLS-real client).
 *
 * If any of these are missing we expose `isRlsTestEnvAvailable() === false`,
 * which the test harness uses to skip the suite gracefully — so contributors
 * without a local DB don't see red CI noise.
 */

export type RlsEnv = {
  supabaseUrl: string;
  serviceRoleKey: string;
  anonKey: string;
};

export function readRlsEnv(): RlsEnv | null {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'http://127.0.0.1:54321';

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY || '';

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  if (!serviceRoleKey || !anonKey) return null;
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
