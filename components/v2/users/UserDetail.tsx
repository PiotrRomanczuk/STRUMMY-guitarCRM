'use client';

import { lazy, Suspense } from 'react';
import { useLayoutMode } from '@/hooks/use-is-widescreen';
import { UserDetailMobile } from './UserDetail.Mobile';
import type { UserDetailData, UserDetailTabsData } from './types';
import type { ParentProfile } from '@/types/ParentProfile';

const UserDetailDesktop = lazy(() => import('./UserDetail.Desktop'));

export interface UserDetailV2Props {
  user: UserDetailData;
  tabsData: UserDetailTabsData;
  parentProfile?: ParentProfile | null;
  linkedStudents?: ParentProfile[];
}

export function UserDetailV2(props: UserDetailV2Props) {
  const mode = useLayoutMode();

  if (mode === 'mobile') {
    return <UserDetailMobile {...props} />;
  }

  return (
    <Suspense fallback={<UserDetailMobile {...props} />}>
      <UserDetailDesktop {...props} />
    </Suspense>
  );
}
