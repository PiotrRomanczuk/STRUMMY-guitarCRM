import SettingsPageClient from '@/components/settings/SettingsPageClient';
import { SettingsV2 } from '@/components/v2/settings';
import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getUserSettings } from '@/app/actions/settings';
import { getUIVersion } from '@/lib/ui-version.server';
import type { UserSettings } from '@/schemas/SettingsSchema';

// Server Component wrapper for Settings page.
// Fetches authenticated user (SSR) and redirects if unauthenticated.
// Hydrates initial settings from the database to avoid a loading flash.
export default async function SettingsPage() {
  const { user } = await getUserWithRolesSSR();
  let isGoogleConnected = false;
  let initialSettings: UserSettings | undefined;
  const supabase = await createClient();

  if (user) {
    const { data } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (data) {
      isGoogleConnected = true;
    }

    // Hydrate initial settings from database
    const settingsResult = await getUserSettings(user.id);
    if (settingsResult.success && settingsResult.settings) {
      initialSettings = settingsResult.settings;
    }
  }

  const uiVersion = await getUIVersion();

  if (uiVersion === 'v2') {
    return (
      <SettingsV2
        isGoogleConnected={isGoogleConnected}
        initialSettings={initialSettings}
      />
    );
  }

  return (
    <SettingsPageClient
      isGoogleConnected={isGoogleConnected}
      initialSettings={initialSettings}
    />
  );
}
