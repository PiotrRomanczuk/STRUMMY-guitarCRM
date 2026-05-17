'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  BookOpen,
  ClipboardList,
  GraduationCap,
  HeartPulse,
  type LucideIcon,
  Music,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavIconName, NavItem } from './sidebar.helpers';

const ICON_BY_NAME: Record<NavIconName, LucideIcon> = {
  users: Users,
  health: HeartPulse,
  ai: Sparkles,
  students: GraduationCap,
  lessons: BookOpen,
  songs: Music,
  assignments: ClipboardList,
  practice: Activity,
  settings: Settings,
};

interface SidebarNavItemProps {
  item: NavItem;
  onNavigate?: () => void;
}

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function SidebarNavItem({ item, onNavigate }: SidebarNavItemProps) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = ICON_BY_NAME[item.icon];
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      data-nav-item={item.name}
      data-active={active ? 'true' : 'false'}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-muted hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'bg-muted text-foreground dark:bg-muted' : 'text-muted-foreground'
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{item.name}</span>
    </Link>
  );
}
