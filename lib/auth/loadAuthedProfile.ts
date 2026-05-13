import 'server-only';
import { cache } from 'react';
import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

export type Role = 'admin' | 'teacher' | 'student';

export type Roles = {
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
};

export type Flags = {
  isParent: boolean;
  isDevelopment: boolean;
};

export type AuthedProfile = {
  user: User;
  roles: Roles;
  flags: Flags;
};

type ProfileRow = {
  id: string;
  is_admin: boolean | null;
  is_teacher: boolean | null;
  is_student: boolean | null;
  is_parent: boolean | null;
  is_development: boolean | null;
};

// Uses the service-role client so the lookup works for Bearer-authenticated
// requests (cookie-only server client returns null because the bearer JWT
// context never reaches it). RLS bypass is safe here — userId comes from a
// Supabase-validated JWT in authenticateRequest, and we only read public
// role flags that are otherwise visible to the user themselves under RLS.
const fetchProfileRow = cache(async (userId: string): Promise<ProfileRow | null> => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, is_admin, is_teacher, is_student, is_parent, is_development')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return data as ProfileRow;
});

export async function loadAuthedProfile(user: User): Promise<AuthedProfile | null> {
  const row = await fetchProfileRow(user.id);
  if (!row) return null;
  return {
    user,
    roles: {
      isAdmin: row.is_admin ?? false,
      isTeacher: row.is_teacher ?? false,
      isStudent: row.is_student ?? false,
    },
    flags: {
      isParent: row.is_parent ?? false,
      isDevelopment: row.is_development ?? false,
    },
  };
}

export const ROLE_TO_ROLES_KEY: Record<Role, keyof Roles> = {
  admin: 'isAdmin',
  teacher: 'isTeacher',
  student: 'isStudent',
};

export function hasRole(roles: Roles, role: Role): boolean {
  return roles[ROLE_TO_ROLES_KEY[role]];
}
