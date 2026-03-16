'use client';

import { lazy, Suspense, ComponentType } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';

/**
 * Creates a responsive component that renders the mobile view by default
 * and lazy-loads the desktop view when the layout mode is widescreen/tablet.
 *
 * Usage:
 * ```tsx
 * const DesktopView = lazy(() => import('./Feature.Desktop'));
 * const Feature = withLayoutMode(MobileView, () => import('./Feature.Desktop'));
 * ```
 */
export function withLayoutMode<P extends Record<string, unknown>>(
  MobileComponent: ComponentType<P>,
  desktopImportFn: () => Promise<{ default: ComponentType<P> }>
) {
  const DesktopComponent = lazy(desktopImportFn);

  function ResponsiveComponent(props: P) {
    const mode = useLayoutMode();

    if (mode === 'mobile') {
      return <MobileComponent {...props} />;
    }

    return (
      <Suspense fallback={<MobileComponent {...props} />}>
        <DesktopComponent {...props} />
      </Suspense>
    );
  }

  ResponsiveComponent.displayName = `withLayoutMode(${
    MobileComponent.displayName || MobileComponent.name || 'Component'
  })`;

  return ResponsiveComponent;
}
