'use client';

import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

interface FilterChipMultiProps {
  filters: FilterOption[];
  active: Set<string>;
  onChange: (active: Set<string>) => void;
  counts?: Record<string, number>;
  className?: string;
}

const DEFAULT_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-500',
  IN_PROGRESS: 'bg-primary',
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-muted-foreground',
  RESCHEDULED: 'bg-amber-500',
};

export function FilterChipMulti({
  filters,
  active,
  onChange,
  counts,
  className,
}: FilterChipMultiProps) {
  const toggle = (value: string) => {
    const next = new Set(active);
    if (next.has(value)) {
      next.delete(value);
    } else {
      next.add(value);
    }
    onChange(next);
  };

  return (
    <div className={cn('flex gap-2 items-center overflow-x-auto flex-shrink-0', className)}>
      {filters.map((f) => {
        const isActive = active.has(f.value);
        const dotColor = f.color ?? DEFAULT_COLORS[f.value] ?? 'bg-muted-foreground';

        return (
          <button
            key={f.value}
            type="button"
            onClick={() => toggle(f.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-[5px] rounded-md text-xs shrink-0',
              'transition-colors',
              isActive
                ? 'border border-foreground/20 bg-foreground/5 text-foreground font-medium'
                : 'border border-border bg-card text-muted-foreground hover:bg-muted'
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColor)} />
            {f.label}
            {counts?.[f.value] != null && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {counts[f.value]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
