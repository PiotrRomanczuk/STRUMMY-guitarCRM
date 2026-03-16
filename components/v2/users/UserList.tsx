'use client';

import { lazy, Suspense } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { UserListMobile } from './UserList.Mobile';
import { UserListSkeleton } from './UserList.Skeleton';
import type { UserProfile } from './types';

const UserListDesktop = lazy(() => import('./UserList.Desktop'));

interface UserListV2Props {
  initialUsers?: UserProfile[];
}

export function UserListV2({ initialUsers }: UserListV2Props) {
  const mode = useLayoutMode();

  if (mode === 'mobile') {
    return <UserListMobile initialUsers={initialUsers} />;
  }

  return (
    <Suspense fallback={<UserListSkeleton />}>
      <UserListDesktop initialUsers={initialUsers} />
    </Suspense>
  );
}
