'use client';

import { cn } from '@/lib/utils';

interface UserFormStatusProps {
  isActive: boolean;
  isShadow: boolean;
  onToggleActive: (value: boolean) => void;
  onToggleShadow: (value: boolean) => void;
}

export function UserFormStatus({
  isActive,
  isShadow,
  onToggleActive,
  onToggleShadow,
}: UserFormStatusProps) {
  return (
    <div className="space-y-5">
      {/* Active User toggle */}
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Active User
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Enable system access immediately
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => onToggleActive(!isActive)}
          className={cn(
            'relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2',
            isActive
              ? 'bg-amber-500 dark:bg-amber-400'
              : 'bg-stone-300 dark:bg-stone-600'
          )}
        >
          <span
            className={cn(
              'inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform mt-1',
              isActive ? 'translate-x-6 ml-0' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {/* Shadow User checkbox */}
      <label className="flex items-start gap-4 cursor-pointer">
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
            Shadow User
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">
            Shadow users can be viewed in reports but cannot log in or receive
            automated notifications.
          </p>
        </div>
        <input
          type="checkbox"
          checked={isShadow}
          onChange={(e) => onToggleShadow(e.target.checked)}
          className={cn(
            'mt-0.5 w-5 h-5 shrink-0 rounded border-2 border-stone-300 dark:border-stone-600',
            'text-amber-500 focus:ring-amber-500/50 focus:ring-offset-0',
            'transition-colors cursor-pointer'
          )}
        />
      </label>
    </div>
  );
}
