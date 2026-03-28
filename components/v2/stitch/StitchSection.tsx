'use client';

import { ReactNode, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StitchSectionProps {
  icon?: ReactNode;
  title: string;
  fieldCount?: number;
  defaultOpen?: boolean;
  collapsible?: boolean;
  children: ReactNode;
  className?: string;
}

export function StitchSection({
  icon,
  title,
  fieldCount,
  defaultOpen = true,
  collapsible = true,
  children,
  className,
}: StitchSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        'rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden',
        className
      )}
    >
      {collapsible ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
        >
          {icon && (
            <span className="shrink-0 w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              {icon}
            </span>
          )}
          <span className="flex-1 text-left font-semibold text-stone-900 dark:text-stone-100">
            {title}
          </span>
          {fieldCount !== undefined && (
            <span className="text-xs font-medium uppercase tracking-wider bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-2.5 py-1 rounded-full">
              {fieldCount} fields
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-stone-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-stone-400" />
          )}
        </button>
      ) : (
        <div className="flex items-center gap-3 px-5 py-4">
          {icon && (
            <span className="shrink-0 w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
              {icon}
            </span>
          )}
          <span className="flex-1 font-semibold text-stone-900 dark:text-stone-100">
            {title}
          </span>
          {fieldCount !== undefined && (
            <span className="text-xs font-medium uppercase tracking-wider bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-2.5 py-1 rounded-full">
              {fieldCount} fields
            </span>
          )}
        </div>
      )}

      {(!collapsible || isOpen) && (
        <div className="px-5 pb-5 pt-1 border-t border-stone-100 dark:border-stone-800">
          {children}
        </div>
      )}
    </div>
  );
}
