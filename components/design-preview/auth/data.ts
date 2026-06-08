import type { AuthRoleOption } from './types';

// Icon path for email (mirrors lesson-primitives LI.email — not part of foundation I dictionary).
export const AUTH_EMAIL_ICON =
  'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm18 2L12 13 2 6';

export const AUTH_ROLE_OPTIONS: AuthRoleOption[] = [
  {
    k: 'teacher',
    title: 'I teach guitar',
    sub: 'Run lessons, track students, manage assignments and song library.',
    icon: 'M12 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0z',
  },
  {
    k: 'student',
    title: 'I take lessons',
    sub: 'Practice, track progress, receive assignments, see your repertoire.',
    icon: 'M3 21h18M5 21v-9l7-5 7 5v9M9 21v-6h6v6',
  },
  {
    k: 'parent',
    title: 'I’m a parent or guardian',
    sub: 'See your child’s practice, upcoming lessons, and notes from their teacher.',
    icon: 'M14 14a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-6 8a7 7 0 0 1 12 0M4 8h.01M4 14h.01M4 20h.01',
  },
];

export const AUTH_SIGNED_IN_EMAIL = 'sarah.chen@strummy.app';
