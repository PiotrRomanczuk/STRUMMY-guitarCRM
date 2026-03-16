'use client';

import {
  LayoutDashboard,
  BookOpen,
  Music,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const TABS = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'lessons', label: 'Lessons', icon: BookOpen },
  { value: 'repertoire', label: 'Songs', icon: Music },
  { value: 'assignments', label: 'Tasks', icon: ClipboardList },
] as const;

export type TabValue = (typeof TABS)[number]['value'];

/** Get the index of a tab value in the TABS array */
export function getTabIndex(tab: TabValue): number {
  return TABS.findIndex((t) => t.value === tab);
}

/** Get the tab value at a given index, clamped to valid range */
export function getTabAtIndex(index: number): TabValue {
  const clamped = Math.max(0, Math.min(index, TABS.length - 1));
  return TABS[clamped].value;
}

interface TabBarProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

export function UserDetailTabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <div
      className="flex gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1"
      role="tablist"
      aria-label="User detail sections"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              'flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-lg',
              'text-sm font-medium transition-colors min-h-[44px]',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
