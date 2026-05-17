'use client';

import { useSearchParams } from 'next/navigation';
import { RoleSwitcher } from '@/components/dashboard/RoleSwitcher';

interface TopbarRoleSwitcherProps {
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

function resolveDefaultView(isAdmin: boolean, isTeacher: boolean, isStudent: boolean): string {
  if (isTeacher) return 'teacher';
  if (isStudent) return 'student';
  if (isAdmin) return 'admin';
  return 'teacher';
}

export function TopbarRoleSwitcher({ isAdmin, isTeacher, isStudent }: TopbarRoleSwitcherProps) {
  const searchParams = useSearchParams();
  const view = searchParams?.get('view');
  const activeView = view ?? resolveDefaultView(isAdmin, isTeacher, isStudent);

  return (
    <RoleSwitcher
      isAdmin={isAdmin}
      isTeacher={isTeacher}
      isStudent={isStudent}
      activeView={activeView}
    />
  );
}
