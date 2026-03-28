'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalChipProps {
  label: string;
  isSelected: boolean;
  onToggle: (label: string) => void;
}

export function GoalChip({ label, isSelected, onToggle }: GoalChipProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(label)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium',
        'transition-all',
        isSelected
          ? 'bg-amber-500 text-white dark:bg-amber-400 dark:text-stone-900'
          : 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
      )}
    >
      {label}
      {isSelected && <X className="h-3.5 w-3.5" />}
    </button>
  );
}
