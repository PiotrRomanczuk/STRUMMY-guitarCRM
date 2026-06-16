/**
 * Multi-role rendering helpers (spec 10). A Profile may hold more than one Role
 * (CONTEXT.md), so labels must reflect the full set held — never coerce to a
 * single role. Flags (isParent, isDevelopment) are NOT Roles and never appear.
 */

/** Full set of held roles, e.g. "Admin · Teacher". Falls back to "User". */
export const roleChipsLabel = (
  isAdmin: boolean,
  isTeacher: boolean,
  isStudent: boolean
): string => {
  const roles: string[] = [];
  if (isAdmin) roles.push('Admin');
  if (isTeacher) roles.push('Teacher');
  if (isStudent) roles.push('Student');
  return roles.length > 0 ? roles.join(' · ') : 'User';
};

/**
 * Sidebar group label. A Profile that teaches (teacher/admin) gets "Teaching"
 * even when it also holds the student role — only a pure student sees "Learning".
 */
export const teachingGroupLabel = (
  isAdmin: boolean,
  isTeacher: boolean,
  isStudent: boolean
): string => (isTeacher || isAdmin ? 'Teaching' : isStudent ? 'Learning' : 'Teaching');
