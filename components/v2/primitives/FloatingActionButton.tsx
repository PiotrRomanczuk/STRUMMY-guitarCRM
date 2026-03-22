'use client';

import { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  /** Click handler */
  onClick: () => void;
  /** Icon to display (defaults to Plus) */
  icon?: ReactNode;
  /** Accessible label for screen readers */
  label: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * M3 Stitch FAB -- gold gradient, rounded-[14px], positioned bottom-right.
 */
export function FloatingActionButton({
  onClick,
  icon,
  label,
  className,
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'fixed right-4 z-40',
        'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
        'w-14 h-14 flex items-center justify-center',
        'rounded-[14px] shadow-lg shadow-primary/20',
        'bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)]',
        'active:scale-95 transition-transform',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
    >
      {icon ?? <Plus className="h-6 w-6" />}
    </button>
  );
}
