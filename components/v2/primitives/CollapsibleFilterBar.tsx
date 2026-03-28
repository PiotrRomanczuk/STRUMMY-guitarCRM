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
 * Horizontal scroll filter chips bar -- M3 Stitch design.
 * Active chip: gold bg, dark text. Inactive: surface-container bg, subtle border.
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
        'relative -mx-4 px-4',
        className
      )}
    >
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide pb-1
                 [mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)]"
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
        'h-9 px-5 rounded-full',
        'text-sm font-medium whitespace-nowrap',
        'transition-all active:scale-95',
        'min-h-[44px]',
        active
          ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,209,131,0.2)]'
          : 'bg-card text-muted-foreground border border-border/15 hover:text-foreground'
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
