import type { StudentRepertoireWithSong } from '@/types/StudentRepertoire';
import type { ParentProfile } from '@/types/ParentProfile';

export interface UserProfile {
  id: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  isAdmin: boolean;
  isTeacher: boolean | null;
  isStudent: boolean | null;
  isActive: boolean;
  isRegistered: boolean;
  studentStatus: 'active' | 'archived';
  created_at: string | null;
}

export interface UserDetailData {
  id: string;
  full_name: string | null;
  email: string;
  is_admin: boolean;
  is_teacher: boolean;
  is_student: boolean;
  is_shadow: boolean | null;
  is_parent: boolean;
  avatar_url: string | null;
  notes: string | null;
  sign_in_count: number;
}

export interface Lesson {
  id: string;
  lesson_teacher_number: number | null;
  lesson_number: number | null;
  date: string | null;
  status: string | null;
  student: { full_name: string } | null;
  teacher: { full_name: string } | null;
}

export interface Assignment {
  id: string;
  title: string | null;
  description: string | null;
  due_date: string | null;
  status: string | null;
}

export interface UserDetailTabsData {
  userId: string;
  lessons: Lesson[];
  assignments: Assignment[];
  repertoire: StudentRepertoireWithSong[];
  parentProfile?: ParentProfile | null;
}

export function getDisplayName(user: UserProfile): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  if (name) return name;
  if (user.full_name && !isEmailDerived(user)) return user.full_name;
  if (user.username) return user.username;
  return user.email?.split('@')[0] ?? 'Unknown';
}

export function isEmailDerived(user: UserProfile): boolean {
  if (!user.full_name || !user.email) return false;
  const localPart = user.email.split('@')[0];
  return user.full_name === localPart;
}

export function hasRealName(user: UserProfile): boolean {
  if (user.firstName || user.lastName) return true;
  if (user.full_name && !isEmailDerived(user)) return true;
  return false;
}

export function getInitials(user: UserProfile): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length > 0) {
    return parts
      .map((p) => p![0])
      .join('')
      .toUpperCase();
  }
  if (user.full_name) {
    const words = user.full_name.trim().split(/\s+/);
    return words
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return (user.email?.[0] ?? '?').toUpperCase();
}

export function getRoleDisplay(user: UserProfile): string {
  const roles = [];
  if (user.isAdmin) roles.push('Admin');
  if (user.isTeacher) roles.push('Teacher');
  if (user.isStudent) roles.push('Student');
  return roles.length > 0 ? roles.join(', ') : 'No Role';
}
