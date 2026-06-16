'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Music,
  BookOpen,
  Users,
  BarChart,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';

interface MobileBottomNavProps {
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  onOpenSidebar: () => void;
}

const SHARED_TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/lessons', label: 'Lessons', icon: BookOpen },
  { href: '/dashboard/songs', label: 'Songs', icon: Music },
];

const TAB_CLASS =
  'flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors duration-200';

export function MobileBottomNav({
  isAdmin,
  isTeacher,
  isStudent,
  onOpenSidebar,
}: MobileBottomNavProps) {
  const pathname = usePathname();

  // Union of held-role destinations: a teacher/admin gets Students, a student
  // gets Stats. A multi-role Profile (e.g. teacher+student) sees both, never
  // an either/or that drops Stats (spec 10, site #3).
  const roleTabs: { href: string; label: string; icon: LucideIcon }[] = [];
  if (isTeacher || isAdmin)
    roleTabs.push({ href: '/dashboard/users', label: 'Students', icon: Users });
  if (isStudent) roleTabs.push({ href: '/dashboard/stats', label: 'Stats', icon: BarChart });

  const tabs = [...SHARED_TABS, ...roleTabs];

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : (pathname?.startsWith(href) ?? false);

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'bg-background/95 backdrop-blur-md border-t border-border',
        'pb-[env(safe-area-inset-bottom)]'
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(TAB_CLASS, active ? 'text-primary' : 'text-muted-foreground')}
              aria-current={active ? 'page' : undefined}
            >
              <tab.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onOpenSidebar}
          className={cn(TAB_CLASS, 'text-muted-foreground')}
          aria-label="Open menu"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-xs font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}
