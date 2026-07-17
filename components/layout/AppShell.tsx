'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/navigation/Header';
import { Toaster } from 'sonner';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { useKeyboardViewport } from '@/hooks/use-keyboard-viewport';
import { logger } from '@/lib/logger';
import { AppShellV2 } from '@/components/v2/navigation';

interface AppShellProps {
  children: React.ReactNode;
  user: { id?: string; email?: string } | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isDevelopment?: boolean;
}

export function AppShell({
  children,
  user,
  isAdmin,
  isTeacher,
  isStudent,
  isDevelopment = false,
}: AppShellProps) {
  const pathname = usePathname();
  useKeyboardViewport();

  // Hide chrome on auth pages even if stale user data is present (e.g. during logout).
  const isAuthPage = ['/sign-in', '/sign-up', '/auth/login', '/auth/register'].includes(
    pathname || ''
  );
  // /dashboard/* owns its own shell (Sidebar + Topbar) via app/dashboard/layout.tsx.
  const isDashboardPage = (pathname || '').startsWith('/dashboard');

  const { isLocal } = getSupabaseConfig();
  logger.info('AppShell:', {
    pathname,
    hasUser: !!user,
    isAuthPage,
    db: isLocal ? 'local' : 'remote',
  });

  // Auth pages (or logged-out) — no navigation.
  if (isAuthPage || !user) {
    return (
      <>
        <Header user={user} isAdmin={isAdmin} isTeacher={isTeacher} isStudent={isStudent} />
        <main className="min-h-screen bg-background">{children}</main>
        <Toaster />
      </>
    );
  }

  // Dashboard owns its own chrome — pass children through.
  if (isDashboardPage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  // Peripheral authenticated pages (/ai, /onboarding, /unsubscribe) — the app shell.
  return (
    <AppShellV2
      user={user}
      isAdmin={isAdmin}
      isTeacher={isTeacher}
      isStudent={isStudent}
      isDevelopment={isDevelopment}
    >
      {children}
    </AppShellV2>
  );
}
