import Link from 'next/link';
import { SidebarMobileSheet } from '@/components/dashboard/Sidebar';
import { getNavItemsForRole, type NavItem } from '@/components/dashboard/Sidebar/sidebar.helpers';
import { TopbarUserMenu } from './Topbar.UserMenu';
import { TopbarRoleSwitcher } from './Topbar.RoleSwitcher';

interface TopbarProps {
  email: string;
  fullName?: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

export function Topbar({ email, fullName, isAdmin, isTeacher, isStudent }: TopbarProps) {
  const navItems: NavItem[] = getNavItemsForRole({ isAdmin, isTeacher, isStudent });
  const roleCount = [isAdmin, isTeacher, isStudent].filter(Boolean).length;
  const hasMultipleRoles = roleCount > 1;

  return (
    <header
      className="bg-background sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-3 md:px-6"
      data-testid="dashboard-topbar"
    >
      <div className="md:hidden">
        <SidebarMobileSheet items={navItems} />
      </div>
      <Link href="/dashboard" className="text-sm font-semibold md:hidden">
        Strummy
      </Link>
      <div className="ml-auto flex items-center gap-2">
        {hasMultipleRoles && (
          <div data-testid="topbar-role-switcher">
            <TopbarRoleSwitcher isAdmin={isAdmin} isTeacher={isTeacher} isStudent={isStudent} />
          </div>
        )}
        <TopbarUserMenu email={email} fullName={fullName} />
      </div>
    </header>
  );
}
