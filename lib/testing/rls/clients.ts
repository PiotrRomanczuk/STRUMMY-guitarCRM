import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { readRlsEnv } from './env';

/**
 * Service-role client. Bypasses RLS; only used in tests for seeding & raw
 * assertions. NEVER import this from production code.
 */
export function createServiceClient(): SupabaseClient {
  const env = readRlsEnv();
  if (!env) {
    throw new Error(
      'createServiceClient(): RLS test env not available. Did you forget to gate with describeIfRls?'
    );
  }
  return createClient(env.supabaseUrl, env.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Sign in as a real user and return a Supabase client whose `auth.uid()`
 * resolves to that user. This is the RLS-real client used by tests.
 *
 * Each call returns a fresh client instance with its own session, so multiple
 * users can be active inside one test without colliding.
 */
export async function signInAs(email: string, password: string): Promise<SupabaseClient> {
  const env = readRlsEnv();
  if (!env) {
    throw new Error('signInAs(): RLS test env not available.');
  }
  const client = createClient(env.supabaseUrl, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`signInAs(${email}) failed: ${error.message}`);
  }
  return client;
}
