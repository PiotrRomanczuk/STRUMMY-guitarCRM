'use client';

import UserOverviewTab from '@/components/users/details/UserOverviewTab';
import UserLessons from '@/components/users/details/UserLessons';
import UserRepertoireTab from '@/components/users/details/UserRepertoireTab';
import UserAssignments from '@/components/users/details/UserAssignments';
import type { TabValue } from './UserDetail.TabBar';
import type { UserDetailTabsData } from './types';
import type { ParentProfile } from '@/types/ParentProfile';

interface TabContentProps {
  activeTab: TabValue;
  tabsData: UserDetailTabsData;
  parentProfile?: ParentProfile | null;
}

export function UserDetailTabContent({
  activeTab,
  tabsData,
  parentProfile,
}: TabContentProps) {
  switch (activeTab) {
    case 'overview':
      return (
        <UserOverviewTab
          userId={tabsData.userId}
          lessons={tabsData.lessons}
          repertoire={tabsData.repertoire}
          assignments={tabsData.assignments}
          parentProfile={parentProfile}
        />
      );
    case 'lessons':
      return (
        <UserLessons lessons={tabsData.lessons} showStudentColumn={false} />
      );
    case 'repertoire':
      return (
        <UserRepertoireTab
          userId={tabsData.userId}
          repertoire={tabsData.repertoire}
        />
      );
    case 'assignments':
      return <UserAssignments assignments={tabsData.assignments} />;
    default:
      return null;
  }
}
