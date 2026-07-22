'use client';

import { useDbConnection, type DbKind } from '@/lib/supabase/useDbConnection';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const badgeStyles: Record<DbKind, string> = {
  dev: 'border-warning/40 bg-warning/15 text-warning',
  prod: 'border-success/40 bg-success/15 text-success',
  preview: 'border-primary/40 bg-primary/15 text-primary',
  other: 'border-border bg-muted text-muted-foreground',
};

const dotStyles: Record<DbKind, string> = {
  dev: 'bg-warning',
  prod: 'bg-success',
  preview: 'bg-primary',
  other: 'bg-muted-foreground',
};

/**
 * Shows which Supabase database the app is currently talking to (dev / prod /
 * preview) so a local test session can never be confused with production.
 */
export function DbConnectionIndicator() {
  const info = useDbConnection();
  if (!info) return null;

  return (
    <div className="flex justify-center mb-4">
      <Badge
        variant="outline"
        className={cn('gap-1.5 px-3 py-1', badgeStyles[info.kind])}
        title={`App is connected to ${info.host}`}
        data-testid="db-connection-indicator"
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[info.kind])} aria-hidden />
        {info.label}
        <span className="font-mono text-[0.7rem] opacity-70">{info.host}</span>
      </Badge>
    </div>
  );
}
