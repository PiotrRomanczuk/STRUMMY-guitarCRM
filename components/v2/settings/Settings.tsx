'use client';

import { lazy, Suspense, useState } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { useSettings } from '@/components/settings/useSettings';
import { SettingsMobile } from './Settings.Mobile';
import type { UserSettings } from '@/schemas/SettingsSchema';

const SettingsDesktop = lazy(() => import('./Settings.Desktop'));

export interface SettingsV2Props {
  settings: UserSettings;
  hasChanges: boolean;
  saving: boolean;
  isGoogleConnected: boolean;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  onSave: () => void;
  onReset: () => void;
}

interface SettingsV2WrapperProps {
  isGoogleConnected?: boolean;
  initialSettings?: UserSettings;
}

/**
 * v2 Settings page component.
 * Mobile: iOS-style grouped settings with section headers.
 * Desktop: Two-column card grid layout.
 *
 * Reuses the existing `useSettings` hook for data fetching/mutations.
 */
export function SettingsV2({
  isGoogleConnected = false,
  initialSettings,
}: SettingsV2WrapperProps) {
  const mode = useLayoutMode();
  const {
    loading,
    saving,
    settings,
    hasChanges,
    updateSetting,
    saveSettings,
    resetSettings,
  } = useSettings(initialSettings);
  const [_error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setError(null);
      await saveSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const props: SettingsV2Props = {
    settings,
    hasChanges,
    saving: saving || loading,
    isGoogleConnected,
    updateSetting,
    onSave: handleSave,
    onReset: resetSettings,
  };

  if (mode === 'mobile') return <SettingsMobile {...props} />;

  return (
    <Suspense fallback={<SettingsMobile {...props} />}>
      <SettingsDesktop {...props} />
    </Suspense>
  );
}
