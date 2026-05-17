export type NavIconName =
  | 'users'
  | 'health'
  | 'ai'
  | 'students'
  | 'lessons'
  | 'songs'
  | 'assignments'
  | 'practice'
  | 'settings';

export interface NavItem {
  /** Visible label, also used as the `data-nav-item` test hook. */
  name: string;
  href: string;
  /** Stable icon identifier — resolved to a component on the client. */
  icon: NavIconName;
}

export interface RoleFlags {
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

const ADMIN_ITEMS: readonly NavItem[] = [
  { name: 'Users', href: '/dashboard/users', icon: 'users' },
  { name: 'Health', href: '/dashboard/health', icon: 'health' },
  { name: 'AI', href: '/dashboard/ai', icon: 'ai' },
];

const TEACHER_ITEMS: readonly NavItem[] = [
  { name: 'Students', href: '/dashboard/students', icon: 'students' },
  { name: 'Lessons', href: '/dashboard/lessons', icon: 'lessons' },
  { name: 'Songs', href: '/dashboard/songs', icon: 'songs' },
  { name: 'Assignments', href: '/dashboard/assignments', icon: 'assignments' },
];

const STUDENT_ITEMS: readonly NavItem[] = [
  { name: 'Lessons', href: '/dashboard/lessons', icon: 'lessons' },
  { name: 'Songs', href: '/dashboard/songs', icon: 'songs' },
  { name: 'Practice', href: '/dashboard/practice', icon: 'practice' },
  { name: 'Assignments', href: '/dashboard/assignments', icon: 'assignments' },
];

const SETTINGS_ITEM: NavItem = {
  name: 'Settings',
  href: '/dashboard/settings',
  icon: 'settings',
};

/**
 * Returns the de-duplicated, role-filtered nav set.
 * Order: admin-only -> teaching -> student-only -> Settings.
 */
export function getNavItemsForRole(roles: RoleFlags): NavItem[] {
  const seen = new Set<string>();
  const result: NavItem[] = [];
  const pushUnique = (items: readonly NavItem[]): void => {
    for (const item of items) {
      if (seen.has(item.href)) continue;
      seen.add(item.href);
      result.push(item);
    }
  };
  if (roles.isAdmin) pushUnique(ADMIN_ITEMS);
  if (roles.isAdmin || roles.isTeacher) pushUnique(TEACHER_ITEMS);
  if (roles.isStudent) pushUnique(STUDENT_ITEMS);
  pushUnique([SETTINGS_ITEM]);
  return result;
}
