'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useUIVersion } from '@/hooks/use-ui-version';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UIVersionToggleProps {
  className?: string;
}

/**
 * Settings toggle to switch between v1 and v2 mobile UI.
 * Triggers a page reload when toggled so server components
 * re-render with the new cookie value.
 */
export function UIVersionToggle({ className }: UIVersionToggleProps) {
  const { version, toggle, pending } = useUIVersion();
  const isV2 = version === 'v2';

  const handleToggle = useCallback(() => {
    try {
      toggle();
    } catch {
      toast.error('Failed to switch UI version. Please try again.');
    }
  }, [toggle]);

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
            isV2 ? 'bg-primary/10' : 'bg-muted'
          )}
        >
          <Sparkles
            className={cn(
              'h-5 w-5',
              isV2 ? 'text-primary' : 'text-muted-foreground'
            )}
          />
        </div>
        <div className="min-w-0">
          <Label
            htmlFor="ui-version-toggle"
            className="text-sm font-medium cursor-pointer"
          >
            New mobile UI
          </Label>
          <p className="text-xs text-muted-foreground">
            Try the redesigned mobile experience
          </p>
        </div>
      </div>

      <Switch
        id="ui-version-toggle"
        checked={isV2}
        onCheckedChange={handleToggle}
        disabled={pending}
        aria-label={isV2 ? 'Switch to classic UI' : 'Switch to new mobile UI'}
      />
    </div>
  );
}
