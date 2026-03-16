'use client';

import { V2ErrorBoundary } from '@/components/v2/primitives/ErrorBoundary';

interface OnboardingV2BoundaryProps {
  children: React.ReactNode;
}

/**
 * Error boundary wrapper for the v2 onboarding flow.
 * Shows a friendly error card if the onboarding component fails to load.
 */
export function OnboardingV2Boundary({ children }: OnboardingV2BoundaryProps) {
  return (
    <V2ErrorBoundary label="Onboarding failed to load">
      {children}
    </V2ErrorBoundary>
  );
}
