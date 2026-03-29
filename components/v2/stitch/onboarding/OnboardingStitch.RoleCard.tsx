'use client';

import { GraduationCap, Piano, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoleCardProps {
  role: 'student' | 'teacher';
  isSelected: boolean;
  onSelect: (role: 'student' | 'teacher') => void;
}

const roleConfig = {
  student: {
    icon: GraduationCap,
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    title: 'Student',
    subtitle: "I'm here to learn guitar",
  },
  teacher: {
    icon: Piano,
    iconBg: 'bg-stone-200 dark:bg-stone-700',
    title: 'Teacher',
    subtitle: 'I manage students and lessons',
  },
} as const;

export function RoleCard({ role, isSelected, onSelect }: RoleCardProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className={cn(
        'relative flex flex-col items-center gap-3 rounded-lg p-5',
        'transition-all text-left',
        isSelected
          ? 'bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-500/40'
          : 'bg-white dark:bg-stone-800 shadow-sm'
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-amber-500 flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
      <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', config.iconBg)}>
        <Icon className="h-6 w-6 text-stone-700 dark:text-stone-300" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-stone-900 dark:text-stone-100">{config.title}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{config.subtitle}</p>
      </div>
    </button>
  );
}
