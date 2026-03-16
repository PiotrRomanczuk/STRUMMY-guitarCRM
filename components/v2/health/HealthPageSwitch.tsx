'use client';

import { useUIVersion } from '@/hooks/use-ui-version';
import { HealthDashboard } from './HealthDashboard';

interface HealthPageSwitchProps {
  /** The v1 health page content as a render prop */
  v1Content: React.ReactNode;
}

/**
 * Client-side switcher between v1 and v2 health dashboard.
 * Reads the UI version cookie and renders the appropriate version.
 */
export function HealthPageSwitch({ v1Content }: HealthPageSwitchProps) {
  const { version } = useUIVersion();

  if (version === 'v2') {
    return <HealthDashboard />;
  }

  return <>{v1Content}</>;
}
