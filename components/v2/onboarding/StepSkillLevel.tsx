'use client';

import { motion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { Music, BarChart2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

interface StepSkillLevelProps {
  selectedLevel: SkillLevel;
  onSelect: (level: SkillLevel) => void;
}

interface SkillOption {
  id: SkillLevel;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderActive: string;
}

const SKILL_LEVELS: SkillOption[] = [
  {
    id: 'beginner',
    icon: Music,
    title: 'Beginner',
    description: 'I know a few chords or am just starting out.',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10',
    borderActive: 'border-green-500',
  },
  {
    id: 'intermediate',
    icon: BarChart2,
    title: 'Intermediate',
    description: 'I can play songs and know some scales.',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderActive: 'border-yellow-500',
  },
  {
    id: 'advanced',
    icon: Sparkles,
    title: 'Advanced',
    description: 'I understand theory and can improvise freely.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderActive: 'border-primary',
  },
];

export function StepSkillLevel({ selectedLevel, onSelect }: StepSkillLevelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          What&apos;s your <span className="text-primary">skill level</span>?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          We&apos;ll tailor your experience to match your current abilities.
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {SKILL_LEVELS.map((skill) => {
          const Icon = skill.icon;
          const isSelected = selectedLevel === skill.id;

          return (
            <motion.button
              key={skill.id}
              variants={listItem}
              type="button"
              onClick={() => onSelect(skill.id)}
              className={cn(
                'w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all',
                'min-h-[72px] text-left',
                'active:scale-[0.98]',
                isSelected
                  ? `${skill.borderActive} ${skill.bgColor}`
                  : 'border-border bg-card hover:border-muted-foreground/30'
              )}
              aria-pressed={isSelected}
            >
              <div
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
                  isSelected ? skill.bgColor : 'bg-muted'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isSelected ? skill.color : 'text-muted-foreground'
                  )}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{skill.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {skill.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
