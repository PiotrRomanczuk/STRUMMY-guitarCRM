import { LayoutDashboard, Settings, type LucideIcon } from 'lucide-react';
import { getMenuGroups, type MenuGroup, type MenuItem } from '@/components/navigation/menuConfig';

export interface RoleFlags {
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isDemoAccount?: boolean;
}

export interface SidebarGroup extends MenuGroup {
  /** Stable identifier for collapse persistence. */
  id: string;
}

export interface SidebarSoloItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
}

export const HOME_ITEM: SidebarSoloItem = {
  id: 'home',
  label: 'Dashboard',
  icon: LayoutDashboard,
  path: '/dashboard',
};

export const SETTINGS_ITEM: SidebarSoloItem = {
  id: 'settings',
  label: 'Settings',
  icon: Settings,
  path: '/dashboard/settings',
};

/**
 * Returns role-filtered groups with stable ids, derived from the central menu config.
 * Empty groups are dropped so the Practice / Admin sections only appear when populated.
 */
export function getSidebarGroups(roles: RoleFlags): SidebarGroup[] {
  return getMenuGroups(roles)
    .filter((g) => g.items.length > 0)
    .map((g) => ({ ...g, id: g.label.toLowerCase().replace(/\s+/g, '-') }));
}

export function getRoleLabel(
  roles: Pick<RoleFlags, 'isAdmin' | 'isTeacher' | 'isStudent'>
): string {
  if (roles.isAdmin) return 'Admin';
  if (roles.isTeacher) return 'Teacher';
  if (roles.isStudent) return 'Student';
  return 'User';
}

export function filterGroups(groups: SidebarGroup[], query: string): SidebarGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => it.label.toLowerCase().includes(q)),
    }))
    .filter((g) => g.items.length > 0);
}

export function matchesItem(item: SidebarSoloItem | MenuItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return item.label.toLowerCase().includes(q);
}
