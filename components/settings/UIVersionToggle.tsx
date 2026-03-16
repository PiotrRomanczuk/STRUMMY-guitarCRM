'use client';

import { useUIVersion } from '@/hooks/use-ui-version';
import { ToggleSetting } from '@/components/settings/SettingsComponents';

/**
 * Toggle switch for the v2 mobile UI.
 * Sets the `strummy-ui-version` cookie and triggers a page reload
 * so server components re-render with the new version.
 */
export function UIVersionToggle() {
  const { version, toggle, pending } = useUIVersion();

  return (
    <ToggleSetting
      id="uiVersion"
      label="Try new mobile UI"
      description="Switch to the redesigned mobile interface (beta)"
      checked={version === 'v2'}
      onChange={toggle}
      disabled={pending}
    />
  );
}
