import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  styleMap: Record<string, string>;
  labelMap?: Record<string, string>;
  className?: string;
}

export function StatusBadge({ status, styleMap, labelMap, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
        styleMap[status] ?? 'bg-muted text-muted-foreground border-border',
        className
      )}
    >
      {labelMap?.[status] ?? status}
    </span>
  );
}
