'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SidebarNavItemProps {
  label: string;
  href: string;
  icon: LucideIcon;
  isHome?: boolean;
  onNavigate?: () => void;
}

function isActive(pathname: string | null, href: string, isHome?: boolean): boolean {
  if (!pathname) return false;
  if (isHome) return pathname === href;
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function SidebarNavItem({
  label,
  href,
  icon: Icon,
  isHome,
  onNavigate,
}: SidebarNavItemProps) {
  const pathname = usePathname();
  const active = isActive(pathname, href, isHome);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      data-nav-item={label}
      data-active={active ? 'true' : 'false'}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'mx-1 flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors',
        'hover:bg-muted/70 hover:text-foreground',
        'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        active
          ? 'bg-primary/10 text-primary dark:bg-primary/15 font-medium'
          : 'text-muted-foreground font-normal'
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
