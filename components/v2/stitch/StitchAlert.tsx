'use client';

import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StitchAlertProps {
  message: string;
  onDismiss?: () => void;
  variant?: 'warning' | 'info';
}

export function StitchAlert({ message, onDismiss, variant = 'warning' }: StitchAlertProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg',
        variant === 'warning' &&
          'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
        variant === 'info' && 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
      )}
      role="alert"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p className="flex-1 text-sm">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
