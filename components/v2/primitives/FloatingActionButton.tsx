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
 * Floating action button positioned at bottom-right, above the mobile nav bar.
 * Uses safe-area-inset to avoid being hidden behind system UI.
 *
 * - 56px (w-14 h-14) touch target
 * - Primary color with shadow
 * - Scale-down on active press
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
        'fixed right-4 z-40 rounded-full shadow-lg',
        'bg-primary text-primary-foreground',
        'w-14 h-14 flex items-center justify-center',
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
