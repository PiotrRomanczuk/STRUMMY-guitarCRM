'use client';

import { lazy, Suspense } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { AdminDashboardMobile } from './AdminDashboard.Mobile';
import { AdminDashboardSkeleton } from './AdminDashboard.Skeleton';

const AdminDashboardDesktop = lazy(
  () => import('./AdminDashboard.Desktop')
);

export interface AdminDashboardProps {
  isAdmin: boolean;
}

/**
 * v2 Admin Dashboard — mobile-first with lazy-loaded desktop view.
 * Displays service health status cards and quick links to admin tools.
 */
export function AdminDashboardV2(props: AdminDashboardProps) {
  const mode = useLayoutMode();

  if (mode === 'mobile') return <AdminDashboardMobile {...props} />;

  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboardDesktop {...props} />
    </Suspense>
  );
}
