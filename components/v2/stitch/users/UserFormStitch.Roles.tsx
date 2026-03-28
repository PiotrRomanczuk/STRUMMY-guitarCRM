'use client';

import { GraduationCap, Music, Globe, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface RoleRowProps {
  icon: ReactNode;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function RoleRow({ icon, label, checked, onChange }: RoleRowProps) {
  return (
    <label className="flex items-center gap-3 py-3 cursor-pointer group">
      <span className="shrink-0 w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400 group-hover:bg-stone-200 dark:group-hover:bg-stone-700 transition-colors">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-stone-700 dark:text-stone-300">
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={cn(
          'w-5 h-5 rounded border-2 border-stone-300 dark:border-stone-600',
          'text-amber-500 focus:ring-amber-500/50 focus:ring-offset-0',
          'transition-colors cursor-pointer'
        )}
      />
    </label>
  );
}

interface UserFormRolesProps {
  isStudent: boolean;
  isTeacher: boolean;
  isAdmin: boolean;
  isParent: boolean;
  onToggle: (role: string, value: boolean) => void;
}

export function UserFormRoles({
  isStudent,
  isTeacher,
  isAdmin,
  isParent,
  onToggle,
}: UserFormRolesProps) {
  return (
    <div className="divide-y divide-stone-100 dark:divide-stone-800">
      <RoleRow
        icon={<GraduationCap className="h-5 w-5" />}
        label="Student"
        checked={isStudent}
        onChange={(v) => onToggle('isStudent', v)}
      />
      <RoleRow
        icon={<Music className="h-5 w-5" />}
        label="Teacher"
        checked={isTeacher}
        onChange={(v) => onToggle('isTeacher', v)}
      />
      <RoleRow
        icon={<Globe className="h-5 w-5" />}
        label="Admin"
        checked={isAdmin}
        onChange={(v) => onToggle('isAdmin', v)}
      />
      <RoleRow
        icon={<Users className="h-5 w-5" />}
        label="Parent / Guardian"
        checked={isParent}
        onChange={(v) => onToggle('isParent', v)}
      />
    </div>
  );
}
