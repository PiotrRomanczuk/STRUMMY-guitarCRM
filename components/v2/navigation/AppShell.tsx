'use client';

import { useState, useCallback, lazy, Suspense } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { useKeyboardViewport } from '@/hooks/use-keyboard-viewport';
import { Toaster } from 'sonner';
import { HeaderV2 } from './Header';
import { MobileBottomNavV2 } from './MobileBottomNav';
import { MobileMoreMenuV2 } from './MobileMoreMenu';

const AppShellDesktopV2 = lazy(() => import('./AppShell.Desktop'));

interface AppShellV2Props {
  children: React.ReactNode;
  user: { id?: string; email?: string } | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

function MobileShell({ children, user, isAdmin, isTeacher, isStudent }: AppShellV2Props) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const openMore = useCallback(() => setMoreMenuOpen(true), []);
  useKeyboardViewport();

  return (
    <>
      <HeaderV2
        user={user}
        isAdmin={isAdmin}
        isTeacher={isTeacher}
        isStudent={isStudent}
      />
      <main className="pt-14 pb-16 md:pb-0 min-h-screen bg-background px-4">
        {children}
      </main>
      <MobileBottomNavV2
        isAdmin={isAdmin}
        isTeacher={isTeacher}
        isStudent={isStudent}
        onOpenMore={openMore}
      />
      <MobileMoreMenuV2
        open={moreMenuOpen}
        onOpenChange={setMoreMenuOpen}
        isAdmin={isAdmin}
        isTeacher={isTeacher}
        isStudent={isStudent}
      />
      <Toaster />
    </>
  );
}

export function AppShellV2(props: AppShellV2Props) {
  const mode = useLayoutMode();

  if (mode === 'mobile') return <MobileShell {...props} />;

  return (
    <Suspense fallback={<MobileShell {...props} />}>
      <AppShellDesktopV2 {...props} />
    </Suspense>
  );
}
