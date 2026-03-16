'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';

interface ActionItem {
  icon?: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

interface BottomActionSheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Sheet title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** List of action items */
  actions: ActionItem[];
  /** Whether to show a cancel button at the bottom */
  showCancel?: boolean;
  /** Custom cancel label */
  cancelLabel?: string;
}

/**
 * Bottom action sheet built on top of the existing Drawer component.
 * Provides a list of tappable actions with icons, minimum 44px touch targets.
 */
export function BottomActionSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  actions,
  showCancel = true,
  cancelLabel = 'Cancel',
}: BottomActionSheetProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          {subtitle && <DrawerDescription>{subtitle}</DrawerDescription>}
        </DrawerHeader>

        <div className="px-4 pb-2">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                action.onClick();
                onOpenChange(false);
              }}
              disabled={action.disabled}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-3',
                'min-h-[44px] rounded-lg',
                'text-left transition-colors',
                'active:bg-muted',
                action.variant === 'destructive'
                  ? 'text-destructive'
                  : 'text-foreground',
                action.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {action.icon && (
                <span className="shrink-0">{action.icon}</span>
              )}
              <span className="text-base font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {showCancel && (
          <div className="px-4 pb-4 pt-2 pb-safe">
            <Button
              variant="outline"
              className="w-full min-h-[44px]"
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
