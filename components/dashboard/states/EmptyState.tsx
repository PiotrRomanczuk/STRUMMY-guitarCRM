import type { ReactNode } from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * EmptyState - Standard empty-data display for dashboard cards.
 *
 * Renders inside a shadcn Card to keep visual rhythm consistent with
 * surrounding loaded cards. Children slot is intended for an optional
 * CTA button (e.g. `<Button>Add lesson</Button>`).
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  className,
  children,
}: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed', className)} data-testid="dashboard-empty-state">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground dark:bg-muted/40">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        ) : null}
        {children ? <div className="mt-2">{children}</div> : null}
      </CardContent>
    </Card>
  );
}
