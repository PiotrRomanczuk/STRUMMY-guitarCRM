'use client';

import { motion } from 'framer-motion';
import { staggerContainer, listItem } from '@/lib/animations/variants';
import { GraduationCap, Guitar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepRoleProps {
  selectedRole: 'student' | 'teacher' | null;
  onSelect: (role: 'student' | 'teacher') => void;
}

const ROLES = [
  {
    id: 'student' as const,
    icon: GraduationCap,
    title: 'Student',
    description: "I'm here to learn guitar and track my progress",
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10',
    borderActive: 'border-green-500',
  },
  {
    id: 'teacher' as const,
    icon: Guitar,
    title: 'Teacher',
    description: 'I teach guitar and want to manage my students',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderActive: 'border-primary',
  },
] as const;

export function StepRole({ selectedRole, onSelect }: StepRoleProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          What brings you to <span className="text-primary">Strummy</span>?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose your role to personalize your experience.
        </p>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {ROLES.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <motion.button
              key={role.id}
              variants={listItem}
              type="button"
              onClick={() => onSelect(role.id)}
              className={cn(
                'w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all',
                'min-h-[80px] text-left',
                'active:scale-[0.98]',
                isSelected
                  ? `${role.borderActive} ${role.bgColor}`
                  : 'border-border bg-card hover:border-muted-foreground/30'
              )}
              aria-pressed={isSelected}
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                  isSelected ? role.bgColor : 'bg-muted'
                )}
              >
                <Icon
                  className={cn(
                    'h-6 w-6',
                    isSelected ? role.color : 'text-muted-foreground'
                  )}
                />
              </div>
              <div className="min-w-0">
                <p className="text-base font-semibold">{role.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {role.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
