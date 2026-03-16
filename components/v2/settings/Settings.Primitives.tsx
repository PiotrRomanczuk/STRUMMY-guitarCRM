'use client';

import { ChevronRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

/** iOS-style grouped section with a section header and divider-separated rows. */
export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <div>
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 mb-2">
        {title}
      </h3>
      <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
        {children}
      </div>
    </div>
  );
}

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
}

/** A single settings row with an icon, label, description, and trailing element. */
export function SettingsRow({ icon, label, description, trailing, onClick }: SettingsRowProps) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 min-h-[44px] w-full text-left',
        onClick && 'active:bg-muted/50 transition-colors'
      )}
    >
      <div className="shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        )}
      </div>
      {trailing ?? (onClick && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />)}
    </Comp>
  );
}

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/** Settings row with a Switch toggle as the trailing element. */
export function ToggleRow({ icon, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <SettingsRow
      icon={icon}
      label={label}
      description={description}
      trailing={
        <Switch
          checked={checked}
          onCheckedChange={onChange}
          className="shrink-0"
        />
      }
    />
  );
}
