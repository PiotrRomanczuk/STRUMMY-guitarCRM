import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { Providers } from '@/components/providers/QueryProvider';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { PostHogPageView } from '@/components/providers/PostHogPageView';
import { PostHogIdentify } from '@/components/providers/PostHogIdentify';

import './globals.css';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { getUIVersion } from '@/lib/ui-version.server';
import { createLogger } from '@/lib/logger';
import { getFontVariableClasses, getAllFontClasses } from '@/lib/fonts';
import { FontProvider } from '@/lib/fonts/FontProvider';
import { DYNAMIC_FONT_SWITCHING } from '@/lib/fonts/fonts.config';

const log = createLogger('Layout');

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Strummy - Guitar Teaching Studio',
  description: 'The premium platform for guitar teachers to manage students, lessons, and track progress',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Strummy',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover' as const,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  log.debug('RootLayout rendering');
  const { user, isAdmin, isTeacher, isStudent } = await getUserWithRolesSSR();
  const uiVersion = await getUIVersion();
  log.debug('User roles', { userId: user?.id, isAdmin, isTeacher, isStudent, uiVersion });

  // When dynamic switching is enabled, load all fonts
  // Otherwise, load only the active font scheme
  const fontClasses = DYNAMIC_FONT_SWITCHING
    ? getAllFontClasses()
    : getFontVariableClasses();

  const content = (
    <PostHogProvider>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogIdentify
        userId={user?.id ?? null}
        email={user?.email ?? null}
        isAdmin={isAdmin}
        isTeacher={isTeacher}
        isStudent={isStudent}
      />
      <Providers>
        <AppShell user={user} isAdmin={isAdmin} isTeacher={isTeacher} isStudent={isStudent} uiVersion={uiVersion}>
          {children}
        </AppShell>
      </Providers>
    </PostHogProvider>
  );

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontClasses} antialiased`}>
        {DYNAMIC_FONT_SWITCHING ? (
          <FontProvider>{content}</FontProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
