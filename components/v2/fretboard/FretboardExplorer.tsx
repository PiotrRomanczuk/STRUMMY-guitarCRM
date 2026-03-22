'use client';

import { useFretboard } from '@/components/fretboard/useFretboard';
import { FretboardDesktop } from './FretboardExplorer.Desktop';
import { FretboardMobile } from './FretboardExplorer.Mobile';

export function FretboardExplorer() {
  const state = useFretboard();

  return (
    <>
      {/* Desktop: 3-column layout (hidden on mobile) */}
      <div className="hidden lg:block h-[calc(100vh-72px)]">
        <FretboardDesktop {...state} />
      </div>
      {/* Mobile: stacked layout (hidden on desktop) */}
      <div className="block lg:hidden">
        <FretboardMobile {...state} />
      </div>
    </>
  );
}
