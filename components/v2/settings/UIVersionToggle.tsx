'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useUIVersion } from '@/hooks/use-ui-version';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UIVersion } from '@/lib/ui-version';

interface UIVersionToggleProps {
  className?: string;
}

/**
 * Settings toggle to switch between v1 and v2 mobile UI.
 * Triggers a page reload when toggled so server components
 * re-render with the new cookie value.
 */
const VERSION_LABELS: Record<UIVersion, string> = {
  v1: 'Classic',
  v2: 'Mobile V2',
  v3: 'Stitch',
};

export function UIVersionToggle({ className }: UIVersionToggleProps) {
  const { version, setVersion, pending } = useUIVersion();

  const handleChange = useCallback(
    (v: string) => {
      try {
        setVersion(v as UIVersion);
      } catch {
        toast.error('Failed to switch UI version. Please try again.');
      }
    },
    [setVersion]
  );

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-4',
        'bg-card rounded-xl border border-border',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            'shrink-0 flex items-center justify-center w-10 h-10 rounded-lg',
            version !== 'v1' ? 'bg-primary/10' : 'bg-muted'
          )}
        >
          <Sparkles
            className={cn(
              'h-5 w-5',
              version !== 'v1' ? 'text-primary' : 'text-muted-foreground'
            )}
          />
        </div>
        <div className="min-w-0">
          <Label
            htmlFor="ui-version-select"
            className="text-sm font-medium cursor-pointer"
          >
            UI Theme
          </Label>
          <p className="text-xs text-muted-foreground">
            Currently: {VERSION_LABELS[version]}
          </p>
        </div>
      </div>

      <select
        id="ui-version-select"
        value={version}
        onChange={(e) => handleChange(e.target.value)}
        disabled={pending}
        className="text-sm bg-muted border border-border rounded-lg px-3 py-2"
      >
        {(['v1', 'v2', 'v3'] as UIVersion[]).map((v) => (
          <option key={v} value={v}>
            {VERSION_LABELS[v]}
          </option>
        ))}
      </select>
    </div>
  );
}
