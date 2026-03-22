'use client';

import { cn } from '@/lib/utils';

const SUGGESTED_PROMPTS = [
  'Create a practice plan',
  'Explain music theory',
  'Song recommendations',
  'Help with chord progressions',
  'Suggest practice routine',
] as const;

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  isDisabled?: boolean;
  className?: string;
}

export function SuggestedPrompts({ onSelect, isDisabled, className }: SuggestedPromptsProps) {
  return (
    <section
      className={cn(
        'overflow-x-auto flex gap-2.5 pb-1',
        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
        className,
      )}
    >
      {SUGGESTED_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          disabled={isDisabled}
          className={cn(
            'whitespace-nowrap h-9 px-5',
            'bg-card border border-border/30 rounded-full',
            'text-primary text-xs font-bold tracking-widest uppercase',
            'flex items-center justify-center',
            'hover:bg-muted transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'shrink-0',
          )}
        >
          {prompt}
        </button>
      ))}
    </section>
  );
}
