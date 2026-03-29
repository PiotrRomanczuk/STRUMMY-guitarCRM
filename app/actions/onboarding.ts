'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { guardTestAccountMutation } from '@/lib/auth/test-account-guard';
import type { OnboardingData } from '@/types/onboarding';
import { logger } from '@/lib/logger';

export async function completeOnboarding(onboardingData: OnboardingData) {
  const { isDevelopment } = await getUserWithRolesSSR();
  const guard = guardTestAccountMutation(isDevelopment);
  if (guard) return guard;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized' };
  }

  const adminClient = createAdminClient();

  // Get existing user metadata
  const firstName = user.user_metadata?.first_name || '';
  const lastName = user.user_metadata?.last_name || '';

  try {
    // 1. Update profile with onboarding data and assign role via boolean flag
    // Write first_name/last_name directly — trigger syncs full_name
    const role = onboardingData.role || 'student';
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        is_student: role === 'student',
        is_teacher: role === 'teacher',
        updated_at: new Date().toISOString(),
        onboarding_completed: true,
      })
      .eq('id', user.id);

    if (profileError) {
      logger.error('Error updating profile:', profileError);
      return { error: 'Failed to update profile' };
    }

    // 2. Persist onboarding preferences
    // Note: user_preferences table not yet in generated DB types — cast to bypass
    const { error: prefsError } = await (
      adminClient as unknown as {
        from: (table: string) => {
          upsert: (
            data: Record<string, unknown>,
            opts: { onConflict: string }
          ) => Promise<{ error: Error | null }>;
        };
      }
    )
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          goals: onboardingData.goals,
          skill_level: onboardingData.skillLevel,
          learning_style: onboardingData.learningStyle || [],
          instrument_preference: onboardingData.instrumentPreference || [],
        },
        { onConflict: 'user_id' }
      );

    if (prefsError) {
      logger.error('Error saving preferences:', prefsError);
      // Non-fatal: profile was updated, preferences failed
      // User can still proceed — preferences can be set later in settings
    }
  } catch (error) {
    logger.error('Onboarding error:', error);
    return { error: 'An unexpected error occurred' };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
