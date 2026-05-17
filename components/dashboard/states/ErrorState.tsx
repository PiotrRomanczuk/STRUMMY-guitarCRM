'use client';

import { useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void | Promise<void>;
  className?: string;
}

/**
 * ErrorState - Standard error display for failed dashboard data loads.
 *
 * If `onRetry` is provided, renders a retry button with a pending state
 * while the callback resolves. Purely presentational otherwise.
 */
export function ErrorState({
  message = 'Something went wrong',
  onRetry,
  className,
}: ErrorStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    try {
      setIsRetrying(true);
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Card
      className={cn('border-destructive/40', className)}
      role="alert"
      data-testid="dashboard-error-state"
    >
      <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive dark:bg-destructive/20">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="max-w-sm text-sm text-foreground">{message}</p>
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            data-testid="dashboard-error-retry"
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            {isRetrying ? 'Retrying…' : 'Retry'}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
