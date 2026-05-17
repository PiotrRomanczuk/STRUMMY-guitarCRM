'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarNavItem } from './Sidebar.NavItem';
import type { SidebarGroup } from './sidebar.helpers';

interface SidebarNavGroupProps {
  group: SidebarGroup;
  onNavigate?: () => void;
}

const STORAGE_KEY = 'sidebar:groupCollapse';

function readCollapse(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

const listeners = new Set<() => void>();
const subscribe = (cb: () => void): (() => void) => {
  listeners.add(cb);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) cb();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
};
const notify = () => listeners.forEach((cb) => cb());

export function SidebarNavGroup({ group, onNavigate }: SidebarNavGroupProps) {
  const collapsed = useSyncExternalStore(
    subscribe,
    () => Boolean(readCollapse()[group.id]),
    () => false
  );

  const toggle = useCallback(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...readCollapse(), [group.id]: !collapsed })
      );
      notify();
    } catch {
      // ignore quota / disabled storage
    }
  }, [collapsed, group.id]);

  return (
    <div className="mt-2 first:mt-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-controls={`sidebar-group-${group.id}`}
        className={cn(
          'flex w-full items-center gap-1.5 px-2.5 pt-2.5 pb-1',
          'text-muted-foreground/70 text-[10.5px] font-semibold tracking-[0.07em] uppercase',
          'hover:text-muted-foreground transition-colors'
        )}
      >
        <span className="flex-1 text-left">{group.label}</span>
        <ChevronRight
          aria-hidden="true"
          className={cn('size-3 transition-transform', collapsed ? '' : 'rotate-90')}
        />
      </button>
      {!collapsed && (
        <div id={`sidebar-group-${group.id}`} className="flex flex-col gap-0.5">
          {group.items.map((item) => (
            <SidebarNavItem
              key={item.id}
              label={item.label}
              href={item.path}
              icon={item.icon}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
