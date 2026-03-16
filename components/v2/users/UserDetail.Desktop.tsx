'use client';

import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/animations/variants';
import { Breadcrumbs } from '@/components/shared';
import UserDetail from '@/components/users/details/UserDetail';
import { UserDetailTabs } from '@/components/users/details/UserDetailTabs';
import type { UserDetailV2Props } from './UserDetail';
import type { ParentProfile } from '@/types/ParentProfile';
import type { Lesson } from '@/components/users/details/UserDetailTabs';

/**
 * Desktop user detail view.
 * Renders the existing v1 UserDetail + UserDetailTabs components
 * in a multi-panel desktop layout with v2 animation wrappers.
 */
export default function UserDetailDesktop({
  user,
  tabsData,
  parentProfile,
  linkedStudents = [],
}: UserDetailV2Props) {
  const userName = user.full_name || user.email || 'User';

  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl mx-auto px-6 lg:px-8 py-6 space-y-6"
    >
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users', href: '/dashboard/users' },
          { label: userName },
        ]}
      />

      <UserDetail
        user={user}
        parentProfile={parentProfile as ParentProfile | null}
        linkedStudents={linkedStudents}
      />

      <UserDetailTabs
        userId={tabsData.userId}
        activeTab="overview"
        lessons={tabsData.lessons as unknown as Lesson[]}
        assignments={tabsData.assignments}
        repertoire={tabsData.repertoire}
        parentProfile={
          parentProfile as {
            id: string;
            full_name: string | null;
            email: string;
          } | null
        }
      />
    </motion.div>
  );
}
