export type AuthRoleKey = 'teacher' | 'student' | 'parent';

export type AuthRoleOption = {
  k: AuthRoleKey;
  title: string;
  sub: string;
  icon: string;
};
