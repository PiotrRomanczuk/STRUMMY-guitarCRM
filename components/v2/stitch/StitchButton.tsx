'use client';

import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StitchButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function StitchButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  loading,
  icon,
  className,
}: StitchButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl',
        'text-sm font-bold uppercase tracking-wider',
        'transition-all active:scale-[0.98]',
        'disabled:opacity-50 disabled:pointer-events-none',
        'min-h-[52px]',
        isPrimary && [
          'bg-gradient-to-r from-amber-600 to-amber-500',
          'dark:from-amber-500 dark:to-amber-400',
          'text-white shadow-lg shadow-amber-500/25',
          'hover:shadow-xl hover:shadow-amber-500/30',
        ],
        !isPrimary && [
          'bg-stone-200 dark:bg-stone-700',
          'text-stone-700 dark:text-stone-300',
          'hover:bg-stone-300 dark:hover:bg-stone-600',
        ],
        className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}

interface StitchFormActionsProps {
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
  disabled?: boolean;
  submitIcon?: ReactNode;
}

export function StitchFormActions({
  onCancel,
  submitLabel,
  loading,
  disabled,
  submitIcon,
}: StitchFormActionsProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div className="max-w-lg mx-auto flex gap-3">
        <StitchButton
          variant="secondary"
          onClick={onCancel}
          icon={<span className="text-lg leading-none">&times;</span>}
          className="min-w-[120px]"
        >
          Cancel
        </StitchButton>
        <StitchButton
          type="submit"
          variant="primary"
          loading={loading}
          disabled={disabled}
          icon={submitIcon}
          className="flex-1"
        >
          {submitLabel}
        </StitchButton>
      </div>
    </div>
  );
}
