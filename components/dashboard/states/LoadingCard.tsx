import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface LoadingCardProps {
  className?: string;
}

/**
 * LoadingCard - Skeleton placeholder shaped like a standard dashboard Card.
 *
 * Use whenever a card-level data source is pending. Matches the dimensions
 * of `components/ui/card.tsx` so swapping to the loaded content does not
 * cause layout shift.
 */
export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <Card
      className={cn('animate-pulse', className)}
      aria-busy="true"
      aria-live="polite"
      data-testid="dashboard-loading-card"
    >
      <CardHeader>
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="mt-2 h-3 w-3/5" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </CardContent>
    </Card>
  );
}
