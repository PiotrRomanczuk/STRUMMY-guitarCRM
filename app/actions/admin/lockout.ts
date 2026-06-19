'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';

/**
 * Admin lockout visibility (spec 06.6). Enforcement lives in
 * `lib/auth/account-lockout.ts`; this surfaces locked accounts to admins and
 * lets them clear a lock. Both counters (`failed_login_attempts`,
 * `locked_until`) are cleared together so a stale `locked_until` cannot re-lock.
 */

export interface LockedAccount {
  id: string;
  email: string;
  fullName: string | null;
  failedLoginAttempts: number;
  lockedUntil: string;
}

type AdminGuard = { userId: string } | { error: string };

async function assertAdmin(): Promise<AdminGuard> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) return { error: 'Unauthorized: Admin access required' };
  return { userId: user.id };
}

export async function getLockedAccounts(): Promise<{
  success: boolean;
  accounts?: LockedAccount[];
  error?: string;
}> {
  const guard = await assertAdmin();
  if ('error' in guard) return { success: false, error: guard.error };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('profiles')
    .select('id, email, full_name, failed_login_attempts, locked_until')
    .gt('locked_until', new Date().toISOString())
    .order('locked_until', { ascending: false });

  if (error) {
    logger.error('Failed to fetch locked accounts', error);
    return { success: false, error: 'Failed to fetch locked accounts' };
  }

  const accounts: LockedAccount[] = (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    failedLoginAttempts: row.failed_login_attempts ?? 0,
    lockedUntil: row.locked_until as string,
  }));

  return { success: true, accounts };
}

export async function unlockAccount(
  profileId: string
): Promise<{ success: boolean; error?: string }> {
  const guard = await assertAdmin();
  if ('error' in guard) return { success: false, error: guard.error };
  if (!profileId) return { success: false, error: 'profileId is required' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ failed_login_attempts: 0, locked_until: null })
    .eq('id', profileId);

  if (error) {
    logger.error('Failed to unlock account', error);
    return { success: false, error: 'Failed to unlock account' };
  }

  revalidatePath('/dashboard');
  return { success: true };
}
