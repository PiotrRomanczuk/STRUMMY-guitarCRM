import type { ComponentType } from 'react';

interface InfoRowProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}

/**
 * Compact info row for the v2 lesson detail page.
 * Renders an icon, label, and value inside a bordered card.
 */
export function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 bg-card rounded-lg border border-border px-4 py-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
