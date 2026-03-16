'use client';

import { motion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { cn } from '@/lib/utils';

interface StepGoalsProps {
  selectedGoals: string[];
  onToggle: (goalId: string) => void;
}

const GOALS = [
  { id: 'learn-songs', label: 'Learn songs', icon: '\uD83C\uDFB8' },
  { id: 'music-theory', label: 'Music theory', icon: '\uD83C\uDFBC' },
  { id: 'performance', label: 'Performance', icon: '\uD83C\uDFA4' },
  { id: 'songwriting', label: 'Songwriting', icon: '\uD83D\uDCDD' },
  { id: 'technique', label: 'Technique', icon: '\u26A1' },
] as const;

export function StepGoals({ selectedGoals, onToggle }: StepGoalsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          What are your <span className="text-primary">goals</span>?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select one or more to help us personalize your learning path.
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap gap-3"
      >
        {GOALS.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);

          return (
            <motion.button
              key={goal.id}
              variants={listItem}
              type="button"
              onClick={() => onToggle(goal.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-full',
                'text-sm font-medium transition-all',
                'border-2 min-h-[44px]',
                'active:scale-95',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:border-muted-foreground/30'
              )}
              aria-pressed={isSelected}
            >
              <span className="text-base" aria-hidden="true">
                {goal.icon}
              </span>
              {goal.label}
            </motion.button>
          );
        })}
      </motion.div>

      {selectedGoals.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Pick at least one goal to continue.
        </p>
      )}
    </div>
  );
}
