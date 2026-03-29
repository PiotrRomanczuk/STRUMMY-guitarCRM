'use client';

import { Music, BarChart3, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

interface SkillCardProps {
  level: SkillLevel;
  isSelected: boolean;
  onSelect: (level: SkillLevel) => void;
}

const skillConfig = {
  beginner: {
    icon: Music,
    iconBg: 'bg-green-100 dark:bg-green-900/40',
    title: 'Beginner',
    subtitle: 'Just starting or know a few chords',
  },
  intermediate: {
    icon: BarChart3,
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    title: 'Intermediate',
    subtitle: 'Can play songs and know some scales',
  },
  advanced: {
    icon: Sparkles,
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
    title: 'Advanced',
    subtitle: 'Understand theory and can improvise',
  },
} as const;

export function SkillCard({ level, isSelected, onSelect }: SkillCardProps) {
  const config = skillConfig[level];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(level)}
      className={cn(
        'flex items-center gap-4 w-full rounded-lg p-4',
        'transition-all text-left',
        isSelected
          ? 'bg-amber-50 dark:bg-amber-950/30 ring-2 ring-amber-500/40'
          : 'bg-white dark:bg-stone-800 shadow-sm'
      )}
    >
      <div
        className={cn(
          'h-11 w-11 shrink-0 rounded-xl flex items-center justify-center',
          config.iconBg
        )}
      >
        <Icon className="h-5 w-5 text-stone-700 dark:text-stone-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-stone-900 dark:text-stone-100">{config.title}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{config.subtitle}</p>
      </div>
      {isSelected && (
        <div className="h-5 w-5 shrink-0 rounded-full bg-amber-500 flex items-center justify-center">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </button>
  );
}
