'use client';

import { ReactNode, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLayoutMode } from '@/hooks/use-is-widescreen';

interface SwipeAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant: 'primary' | 'destructive';
}

interface SwipeableListItemProps {
  /** Content rendered inside the swipeable row */
  children: ReactNode;
  /** Actions revealed on swipe-left */
  actions?: SwipeAction[];
  /** Edit handler (convenience shortcut, adds edit action) */
  onEdit?: () => void;
  /** Delete handler (convenience shortcut, adds delete action) */
  onDelete?: () => void;
  /** Additional CSS classes */
  className?: string;
}

const SWIPE_THRESHOLD = 80;
const ACTION_WIDTH = 72;

/**
 * Swipeable list item that reveals action buttons on left-swipe.
 * Only enabled on mobile viewport. On desktop, actions are hidden
 * (use context menus or inline buttons instead).
 */
export function SwipeableListItem({
  children,
  actions: customActions,
  onEdit,
  onDelete,
  className,
}: SwipeableListItemProps) {
  const mode = useLayoutMode();
  const isMobile = mode === 'mobile';
  const [isRevealed, setIsRevealed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);

  // Build actions from props
  const actions: SwipeAction[] = customActions ?? [
    ...(onEdit
      ? [{
          icon: <Pencil className="h-5 w-5" />,
          label: 'Edit',
          onClick: onEdit,
          variant: 'primary' as const,
        }]
      : []),
    ...(onDelete
      ? [{
          icon: <Trash2 className="h-5 w-5" />,
          label: 'Delete',
          onClick: onDelete,
          variant: 'destructive' as const,
        }]
      : []),
  ];

  const totalActionsWidth = actions.length * ACTION_WIDTH;
  const actionOpacity = useTransform(x, [-totalActionsWidth, 0], [1, 0]);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const shouldReveal = info.offset.x < -SWIPE_THRESHOLD;
      setIsRevealed(shouldReveal);
    },
    []
  );

  const handleClose = useCallback(() => {
    setIsRevealed(false);
  }, []);

  // On non-mobile, just render children without swipe
  if (!isMobile || actions.length === 0) {
    return <div className={cn('relative', className)}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      {/* Action buttons behind the content */}
      <motion.div
        className="absolute inset-y-0 right-0 flex"
        style={{ opacity: actionOpacity }}
      >
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => {
              action.onClick();
              handleClose();
            }}
            className={cn(
              'flex items-center justify-center',
              'w-[72px] h-full',
              action.variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-primary text-primary-foreground'
            )}
            aria-label={action.label}
          >
            {action.icon}
          </button>
        ))}
      </motion.div>

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -totalActionsWidth, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={{ x: isRevealed ? -totalActionsWidth : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ x }}
        className="relative z-10 bg-card"
      >
        {children}
      </motion.div>
    </div>
  );
}
