'use client';

import { cn } from '@/lib/utils';

interface FilterOption {
  label: string;
  value: string;
}

interface CollapsibleFilterBarProps {
  /** Available filter options */
  filters: FilterOption[];
  /** Currently active filter value (null = show all) */
  active: string | null;
  /** Called when a filter chip is tapped */
  onChange: (value: string | null) => void;
  /** Label for the "show all" chip */
  allLabel?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Horizontal scroll filter chips bar.
 * Uses overflow-x-auto with hidden scrollbar for a clean swipe experience.
 * Includes an "All" chip as the first option.
 */
export function CollapsibleFilterBar({
  filters,
  active,
  onChange,
  allLabel = 'All',
  className,
}: CollapsibleFilterBarProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4',
        className
      )}
    >
      <FilterChip
        label={allLabel}
        active={active === null}
        onClick={() => onChange(null)}
      />
      {filters.map((filter) => (
        <FilterChip
          key={filter.value}
          label={filter.label}
          active={active === filter.value}
          onClick={() => onChange(filter.value)}
        />
      ))}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center',
        'h-11 px-4 rounded-full',
        'text-sm font-medium whitespace-nowrap',
        'transition-colors',
        'min-h-[44px]',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
