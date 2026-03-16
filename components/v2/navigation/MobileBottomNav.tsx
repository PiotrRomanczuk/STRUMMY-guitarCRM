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
        'bg-background/80 backdrop-blur-xl border-t border-border/50',
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
                active ? 'text-primary' : 'text-muted-foreground',
              )}
              aria-current={active ? 'page' : undefined}
            >
              {active && (
                <motion.div
                  layoutId="v2-bottom-nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.75} />
              <span className={cn('text-[10px]', active ? 'font-semibold' : 'font-medium')}>
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
            'flex-1 h-full min-h-[44px] text-muted-foreground',
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
