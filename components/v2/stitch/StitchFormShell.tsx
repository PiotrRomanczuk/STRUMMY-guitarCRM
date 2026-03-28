'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StitchFormShellProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}

export function StitchFormShell({
  title,
  subtitle,
  onClose,
  children,
  className,
}: StitchFormShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-[100dvh] bg-stone-50 dark:bg-stone-950">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="shrink-0 p-2 -ml-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-stone-700 dark:text-stone-300" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-stone-900 dark:text-stone-100 truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-stone-500 dark:text-stone-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 rounded-full bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-stone-600 dark:text-stone-300" />
            </button>
          )}
        </div>
      </header>

      <div
        className={cn(
          'max-w-lg mx-auto px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))]',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
