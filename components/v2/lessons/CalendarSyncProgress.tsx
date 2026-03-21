'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CalendarSync, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SyncProgress } from './useCalendarSync';

interface CalendarSyncProgressProps {
  progress: SyncProgress;
  onDismiss: () => void;
  onCancel: () => void;
}

export function CalendarSyncProgress({
  progress,
  onDismiss,
  onCancel,
}: CalendarSyncProgressProps) {
  const { phase, current, total, detail, imported, skipped, updated } = progress;
  const isActive = phase !== 'idle';
  const isDone = phase === 'done';
  const isError = phase === 'error';
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md',
            'rounded-xl border bg-card shadow-lg',
            'p-4 space-y-3',
            isError && 'border-destructive/50'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDone ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : isError ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <CalendarSync className="h-4 w-4 animate-spin text-primary" />
              )}
              <span className="text-sm font-medium">
                {isDone
                  ? 'Sync complete'
                  : isError
                    ? 'Sync failed'
                    : 'Syncing calendar...'}
              </span>
            </div>
            <button
              type="button"
              onClick={isDone || isError ? onDismiss : onCancel}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
              aria-label={isDone || isError ? 'Dismiss' : 'Cancel sync'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress bar */}
          {phase === 'syncing' && total > 0 && (
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ ease: 'easeOut', duration: 0.3 }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {current} / {total}
                </span>
                <span>{pct}%</span>
              </div>
            </div>
          )}

          {/* Spinner for connecting/fetching phases */}
          {(phase === 'connecting' || phase === 'fetching') && (
            <div className="flex items-center justify-center py-1">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Detail line */}
          <p className="text-xs text-muted-foreground truncate">{detail}</p>

          {/* Summary counters */}
          {(phase === 'syncing' || isDone) && (imported > 0 || updated > 0 || skipped > 0) && (
            <div className="flex gap-3 text-xs">
              {imported > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400">
                  +{imported} new
                </span>
              )}
              {updated > 0 && (
                <span className="text-blue-600 dark:text-blue-400">
                  {updated} updated
                </span>
              )}
              {skipped > 0 && (
                <span className="text-muted-foreground">{skipped} skipped</span>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
