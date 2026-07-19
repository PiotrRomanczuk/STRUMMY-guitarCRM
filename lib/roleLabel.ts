type Roles = { isAdmin: boolean; isTeacher: boolean; isStudent: boolean };

/**
 * Joins every role a user holds instead of picking one — a user with both
 * isAdmin and isTeacher must see "Admin · Teacher", not just "Admin".
 */
export function resolveRoleLabel({ isAdmin, isTeacher, isStudent }: Roles): string {
  const roles: string[] = [];
  if (isAdmin) roles.push('Admin');
  if (isTeacher) roles.push('Teacher');
  if (isStudent) roles.push('Student');
  return roles.length > 0 ? roles.join(' · ') : 'User';
}
