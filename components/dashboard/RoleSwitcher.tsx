'use client';

import Link from 'next/link';
import { Shield, GraduationCap, Guitar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface Role {
  id: string;
  label: string;
  icon: LucideIcon;
  param: string;
}

interface RoleSwitcherProps {
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  /** Which view is currently active */
  activeView: string;
  className?: string;
}

export function RoleSwitcher({
  isAdmin,
  isTeacher,
  isStudent,
  activeView,
  className,
}: RoleSwitcherProps) {
  const roles: Role[] = [];

  if (isTeacher) roles.push({ id: 'teacher', label: 'Teacher', icon: Guitar, param: 'teacher' });
  if (isStudent) roles.push({ id: 'student', label: 'Student', icon: GraduationCap, param: 'student' });
  if (isAdmin) roles.push({ id: 'admin', label: 'Admin', icon: Shield, param: 'admin' });

  // Don't show switcher if user has only one role
  if (roles.length <= 1) return null;

  return (
    <div className={cn('flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border', className)}>
      {roles.map((role) => {
        const Icon = role.icon;
        const isActive = activeView === role.id;

        return (
          <Link
            key={role.id}
            href={`/dashboard?view=${role.param}`}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              'min-h-[32px]',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">{role.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
