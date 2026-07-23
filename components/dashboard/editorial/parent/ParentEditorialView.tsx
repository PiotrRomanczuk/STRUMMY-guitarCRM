import { Fraunces, Geist, Geist_Mono } from 'next/font/google';

import {
  getParentChildOverview,
  getParentChildren,
  resolveActiveChildId,
} from '@/lib/services/parent-dashboard-queries';

import { ParentDashboardEditorial } from './ParentDashboardEditorial';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  weight: ['400', '500'],
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz'],
  display: 'swap',
});

/**
 * Server wrapper: resolves the parent's linked children, picks the active
 * child (from the ?child= query param), loads that child's check-in overview,
 * and hands it all to the presentational dashboard.
 */
export async function ParentEditorialView({
  userId,
  childParam,
}: {
  userId: string;
  childParam: string | undefined;
}) {
  const now = new Date();
  const childrenList = await getParentChildren(userId);
  const activeChildId = resolveActiveChildId(childrenList, childParam);
  const child = activeChildId ? await getParentChildOverview(activeChildId, now) : null;

  return (
    <div className={`theme-editorial ${geist.variable} ${geistMono.variable} ${fraunces.variable}`}>
      <ParentDashboardEditorial
        childrenList={childrenList}
        activeChildId={activeChildId}
        child={child}
      />
    </div>
  );
}
