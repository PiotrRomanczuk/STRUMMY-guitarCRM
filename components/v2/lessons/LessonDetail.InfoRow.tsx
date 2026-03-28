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
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary/70" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
