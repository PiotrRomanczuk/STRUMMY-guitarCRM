'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Music, BookOpen, Users,
  BarChart, MoreHorizontal, type LucideIcon,
} from 'lucide-react';

interface MobileBottomNavProps {
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  onOpenMore: () => void;
}

interface TabDef {
  href: string;
  label: string;
  icon: LucideIcon;
}

const SHARED_TABS: TabDef[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/lessons', label: 'Lessons', icon: BookOpen },
  { href: '/dashboard/songs', label: 'Songs', icon: Music },
];

function isTabActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return href === '/dashboard'
    ? pathname === '/dashboard'
    : pathname.startsWith(href);
}

export function MobileBottomNavV2({ isStudent, onOpenMore }: MobileBottomNavProps) {
  const pathname = usePathname();

  const tabs: TabDef[] = [
    ...SHARED_TABS,
    isStudent
      ? { href: '/dashboard/stats', label: 'Stats', icon: BarChart }
      : { href: '/dashboard/users', label: 'Students', icon: Users },
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'bg-[rgba(32,31,31,0.7)] backdrop-blur-[20px]',
        'pb-[env(safe-area-inset-bottom)]',
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5',
                'flex-1 h-full min-h-[44px] transition-colors duration-200',
                active
                  ? 'text-primary'
                  : 'text-[#d5c4ad] opacity-60',
              )}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  layoutId="v2-bottom-nav-indicator"
                  className="absolute inset-x-2 top-1.5 bottom-1.5 rounded-full bg-primary/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon className="relative z-10 h-5 w-5" strokeWidth={active ? 2.5 : 1.75} />
              <span className={cn('relative z-10 text-[10px]', active ? 'font-semibold' : 'font-medium')}>
                {tab.label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onOpenMore}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5',
            'flex-1 h-full min-h-[44px] text-[#d5c4ad] opacity-60',
          )}
          aria-label="Open more menu"
        >
          <MoreHorizontal className="h-5 w-5" strokeWidth={1.75} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}
