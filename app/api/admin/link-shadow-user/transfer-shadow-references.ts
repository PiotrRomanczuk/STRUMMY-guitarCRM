import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';

const log = createLogger('link-shadow-user');

export interface TransferResult {
  updatedProfile: Record<string, unknown>;
  counts: Record<string, number>;
}

/**
 * Transfer all FK references from a shadow profile to a real user, then
 * create a new profile for the real user and delete the shadow.
 *
 * Uses the unified SQL function `transfer_shadow_profile_references()`
 * which covers ALL tables referencing profiles(id).
 */
export async function transferShadowReferences(
  supabase: ReturnType<typeof createAdminClient>,
  shadowId: string,
  realUserId: string,
  shadowProfile: { email: string; full_name: string | null },
  realEmail: string
): Promise<TransferResult> {
  // Step 1: Transfer all FK references via unified SQL function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpcFn = supabase.rpc as (...args: unknown[]) => ReturnType<typeof supabase.rpc>;
  const { data: transferCounts, error: rpcError } = await rpcFn(
    'transfer_shadow_profile_references',
    { p_old_id: shadowId, p_new_id: realUserId }
  );

  if (rpcError) {
    throw new Error(`FK transfer failed: ${rpcError.message}`);
  }

  log.info('FK references transferred', { counts: transferCounts });

  // Step 2: Create the new profile for the real user
  const { data: newProfile, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: realUserId,
      user_id: realUserId,
      email: realEmail,
      full_name: shadowProfile.full_name,
      is_shadow: false,
      is_student: true,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create profile for real user: ${insertError.message}`);
  }

  // Step 3: Delete the old shadow profile
  const { error: deleteError } = await supabase.from('profiles').delete().eq('id', shadowId);

  if (deleteError) {
    throw new Error(`Failed to delete shadow profile: ${deleteError.message}`);
  }

  const counts: Record<string, number> =
    typeof transferCounts === 'object' && transferCounts !== null
      ? (transferCounts as Record<string, number>)
      : {};

  return { updatedProfile: newProfile, counts };
}
