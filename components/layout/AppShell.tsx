'use client';

import { useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/navigation/Header';
import { HorizontalNav } from '@/components/navigation/HorizontalNav';
import { AppSidebar } from '@/components/navigation/AppSidebar';
import { Toaster } from 'sonner';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav';
import { MobileMoreMenu } from '@/components/navigation/MobileMoreMenu';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { useKeyboardViewport } from '@/hooks/use-keyboard-viewport';
import { NotificationBell } from '@/components/notifications';
import { logger } from '@/lib/logger';
import type { UIVersion } from '@/lib/ui-version';
import { AppShellV2 } from '@/components/v2/navigation';

interface AppShellProps {
  children: React.ReactNode;
  user: { id?: string; email?: string } | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  uiVersion?: UIVersion;
}

export function AppShell({
  children,
  user,
  isAdmin,
  isTeacher,
  isStudent,
  uiVersion = 'v1',
}: AppShellProps) {
  const pathname = usePathname();
  const layoutMode = useLayoutMode();
  useKeyboardViewport();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const openMoreMenu = useCallback(() => setMoreMenuOpen(true), []);

  // Hide sidebar on auth pages even if user data is present (e.g. stale state during logout)
  const isAuthPage = ['/sign-in', '/sign-up', '/auth/login', '/auth/register'].includes(
    pathname || ''
  );
  const showNavigation = !!user && !isAuthPage;

  const useSidebar = showNavigation && (layoutMode === 'widescreen' || layoutMode === 'tablet');
  const _useMobileNav = showNavigation && layoutMode === 'mobile';

  const { isLocal } = getSupabaseConfig();
  logger.info('AppShell:', {
    pathname,
    hasUser: !!user,
    isAuthPage,
    showNavigation,
    layoutMode,
    db: isLocal ? 'local' : 'remote',
  });

  // Auth pages - no navigation
  if (isAuthPage || !user) {
    return (
      <>
        <Header user={user} isAdmin={isAdmin} isTeacher={isTeacher} isStudent={isStudent} />
        <main className="min-h-screen bg-background">{children}</main>
        <Toaster />
      </>
    );
  }

  // v2 shell: dedicated navigation with responsive mobile/desktop layout
  if (uiVersion === 'v2') {
    return (
      <AppShellV2
        user={user}
        isAdmin={isAdmin}
        isTeacher={isTeacher}
        isStudent={isStudent}
      >
        {children}
      </AppShellV2>
    );
  }

  // Widescreen and tablet displays with sidebar (collapsed by default on tablet)
  if (useSidebar) {
    return (
      <SidebarProvider defaultOpen={layoutMode === 'widescreen'}>
        <AppSidebar isAdmin={isAdmin} isTeacher={isTeacher} isStudent={isStudent} />
        <SidebarInset className="overflow-x-hidden">
          <header className="flex h-16 shrink-0 items-center justify-between border-b px-6">
            <h2 className="text-lg font-semibold">
              {(() => {
                if (pathname === '/dashboard') return 'Dashboard';

                const segments = pathname?.split('/') || [];
                const lastSegment = segments.pop() || 'Page';

                // Check if last segment is a UUID (contains 5 hyphens and is 36 chars)
                const isUUID = lastSegment.length === 36 && lastSegment.split('-').length === 5;

                if (isUUID) {
                  // Get the parent segment for context
                  const parentSegment = segments.pop();
                  return parentSegment
                    ? parentSegment.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
                    : 'Details';
                }

                return lastSegment
                  .replace(/-/g, ' ')
                  .replace(/^\w/, (c) => c.toUpperCase());
              })()}
            </h2>
            <NotificationBell userId={user?.id} />
          </header>
          <main className="flex-1 bg-background p-3 sm:p-4 md:p-6 lg:p-8 ultrawide:p-10 overflow-x-hidden w-full max-w-full">
            {children}
          </main>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    );
  }

  // Mobile displays with top horizontal nav + bottom nav
  return (
    <>
      <HorizontalNav user={user} isAdmin={isAdmin} isTeacher={isTeacher} isStudent={isStudent} />
      <main className="pt-16 pb-16 md:pb-0 min-h-screen bg-background px-4 sm:px-6 md:px-8">{children}</main>
      <MobileBottomNav
        isAdmin={isAdmin}
        isTeacher={isTeacher}
        isStudent={isStudent}
        onOpenSidebar={openMoreMenu}
      />
      <MobileMoreMenu
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
