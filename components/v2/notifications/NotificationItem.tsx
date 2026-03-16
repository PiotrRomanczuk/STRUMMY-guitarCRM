'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InAppNotification } from '@/lib/services/in-app-notification-service';

interface NotificationItemProps {
  notification: InAppNotification;
  onMarkAsRead: (id: string) => void;
  onDismiss?: (id: string) => void;
}

const SWIPE_THRESHOLD = 80;

const VARIANT_ICONS: Record<string, string> = {
  success: '🎉',
  warning: '⚠️',
  error: '🔴',
  info: 'ℹ️',
  default: '🔔',
};

/**
 * Swipeable notification row for v2 mobile notification center.
 * Swipe left to reveal mark-as-read and dismiss actions.
 */
export function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
}: NotificationItemProps) {
  const x = useMotionValue(0);
  const actionsOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const constraintRef = useRef<HTMLDivElement>(null);

  // Compute drag constraint based on number of visible action buttons
  const actionButtonCount =
    (!notification.is_read ? 1 : 0) + (onDismiss ? 1 : 0);
  const dragLeftConstraint = -(actionButtonCount * 72);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      // Snapped open — actions visible
    }
  };

  const icon = notification.icon || VARIANT_ICONS[notification.variant || 'default'] || '🔔';

  const content = (
    <div ref={constraintRef} className="relative overflow-hidden rounded-xl">
      {/* Action buttons revealed on swipe */}
      <motion.div
        style={{ opacity: actionsOpacity }}
        className="absolute inset-y-0 right-0 flex"
        aria-hidden="true"
      >
        {!notification.is_read && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="w-[72px] bg-primary flex items-center justify-center"
            aria-label="Mark as read"
          >
            <Check className="h-5 w-5 text-primary-foreground" />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={() => onDismiss(notification.id)}
            className="w-[72px] bg-destructive flex items-center justify-center"
            aria-label="Dismiss"
          >
            <Trash2 className="h-5 w-5 text-white" />
          </button>
        )}
      </motion.div>

      {/* Swipeable card */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: dragLeftConstraint, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className={cn(
          'relative bg-card border border-border rounded-xl p-4',
          'active:bg-muted/50 transition-colors',
          !notification.is_read && 'border-l-4 border-l-primary'
        )}
      >
        <div className="flex gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">
              {icon}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-medium text-sm truncate text-foreground">
                {notification.title}
              </h4>
              {!notification.is_read && (
                <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full" />
              )}
            </div>

            <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
              {notification.body}
            </p>

            <div className="flex items-center justify-between gap-2">
              <time className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                })}
              </time>
              {notification.action_label && (
                <span className="text-[11px] font-medium text-primary">
                  {notification.action_label}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  if (notification.action_url) {
    return (
      <Link
        href={notification.action_url}
        className="block"
        onClick={() => {
          if (!notification.is_read) onMarkAsRead(notification.id);
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className="w-full text-left"
      onClick={() => {
        if (!notification.is_read) onMarkAsRead(notification.id);
      }}
    >
      {content}
    </button>
  );
}
