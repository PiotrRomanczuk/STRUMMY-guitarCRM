'use client';

import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MobilePageShellProps {
  /** Page title displayed in the sticky header */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Show back button (defaults to true) */
  showBack?: boolean;
  /** Custom back handler (defaults to router.back) */
  onBack?: () => void;
  /** Action buttons rendered on the right side of the header */
  headerActions?: ReactNode;
  /** Optional FAB rendered at bottom-right above nav */
  fab?: ReactNode;
  /** Main scrollable content */
  children: ReactNode;
  /** Additional CSS classes for the content area */
  className?: string;
}

/**
 * v2 mobile page wrapper with sticky header, scrollable content,
 * and safe area padding for bottom nav.
 *
 * Layout structure:
 * - Sticky header with back button, title, and action buttons
 * - Scrollable content area
 * - Bottom safe-area padding (64px nav + safe-area-inset)
 * - Optional FAB slot
 */
export function MobilePageShell({
  title,
  subtitle,
  showBack = true,
  onBack,
  headerActions,
  fab,
  children,
  className,
}: MobilePageShellProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-4rem)]">
      {/* Sticky header */}
      <header
        className={cn(
          'sticky top-0 z-30 bg-background/80 backdrop-blur-xl',
          'border-b border-border/50',
          'px-4 py-3'
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="shrink-0 min-h-[44px] min-w-[44px]"
                aria-label="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {headerActions && (
            <div className="flex items-center gap-1 shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      </header>

      {/* Scrollable content */}
      <div
        className={cn(
          'flex-1 px-4 py-4 space-y-4',
          'pb-[calc(4rem+env(safe-area-inset-bottom))]',
          className
        )}
      >
        {children}
      </div>

      {/* FAB slot */}
      {fab}
    </div>
  );
}
