'use client';

import { useMemo, useState } from 'react';
import { SidebarNavGroup } from './Sidebar.NavGroup';
import { SidebarNavItem } from './Sidebar.NavItem';
import { SidebarSearch } from './Sidebar.Search';
import {
  filterGroups,
  getSidebarGroups,
  HOME_ITEM,
  matchesItem,
  type RoleFlags,
  SETTINGS_ITEM,
} from './sidebar.helpers';

interface SidebarBodyProps {
  roles: RoleFlags;
  /** Called after navigating; mobile sheet closes itself with this. */
  onNavigate?: () => void;
}

export function SidebarBody({ roles, onNavigate }: SidebarBodyProps) {
  const [query, setQuery] = useState('');
  const groups = useMemo(() => getSidebarGroups(roles), [roles]);
  const visibleGroups = useMemo(() => filterGroups(groups, query), [groups, query]);
  const homeVisible = matchesItem(HOME_ITEM, query);
  const settingsVisible = matchesItem(SETTINGS_ITEM, query);
  const empty = visibleGroups.length === 0 && !homeVisible && !settingsVisible;

  return (
    <>
      <div className="px-3 pt-3 pb-2">
        <SidebarSearch value={query} onChange={setQuery} />
      </div>
      <nav
        aria-label="Dashboard navigation"
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-3"
      >
        {homeVisible && (
          <div className="mt-1">
            <SidebarNavItem
              isHome
              label={HOME_ITEM.label}
              href={HOME_ITEM.path}
              icon={HOME_ITEM.icon}
              onNavigate={onNavigate}
            />
          </div>
        )}
        {visibleGroups.map((group) => (
          <SidebarNavGroup key={group.id} group={group} onNavigate={onNavigate} />
        ))}
        {settingsVisible && (
          <div className="mt-3 border-t pt-2">
            <SidebarNavItem
              label={SETTINGS_ITEM.label}
              href={SETTINGS_ITEM.path}
              icon={SETTINGS_ITEM.icon}
              onNavigate={onNavigate}
            />
          </div>
        )}
        {empty && (
          <p className="text-muted-foreground px-3 py-4 text-xs">
            No matches for &ldquo;{query}&rdquo;.
          </p>
        )}
      </nav>
    </>
  );
}
