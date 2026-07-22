'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { getInAppNotifications, markNotificationAsRead } from '@/app/actions/in-app-notifications';
import type { InAppNotification } from '@/lib/services/in-app-notification-service';
import { VARIANT_COLOURS, formatRelative } from './notifications-editorial.helpers';

type Props = {
  initialNotifications: InAppNotification[];
  userId: string;
  now: Date;
  pageSize: number;
};

/**
 * Renders the notification rows plus a "Load more" control that appends
 * additional pages fetched via `getInAppNotifications`. Re-syncs from
 * `initialNotifications` when it changes (e.g. after "mark all read"
 * revalidates the parent server component with fresh data).
 */
export const NotificationsEditorialList = ({
  initialNotifications,
  userId,
  now,
  pageSize,
}: Props) => {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [offset, setOffset] = useState(initialNotifications.length);
  const [hasMore, setHasMore] = useState(initialNotifications.length === pageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNotifications(initialNotifications);
    setOffset(initialNotifications.length);
    setHasMore(initialNotifications.length === pageSize);
  }, [initialNotifications, pageSize]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    setError(null);

    try {
      const nextPage = await getInAppNotifications(userId, { limit: pageSize, offset });
      setNotifications((prev) => [...prev, ...nextPage]);
      setOffset((prev) => prev + nextPage.length);
      setHasMore(nextPage.length === pageSize);
    } catch {
      setError('Failed to load more notifications. Please try again.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await markNotificationAsRead(id);
  };

  if (notifications.length === 0) {
    return (
      <div
        style={{
          padding: '40px 24px',
          textAlign: 'center',
          color: 'var(--ink-4)',
          fontStyle: 'italic',
          fontFamily: 'var(--serif)',
          fontSize: 15,
        }}
      >
        No notifications yet. Updates about lessons, assignments, and practice will arrive here.
      </div>
    );
  }

  return (
    <>
      {notifications.map((n, i) => (
        <NotificationRowItem
          key={n.id}
          notification={n}
          now={now}
          isLast={i === notifications.length - 1 && !hasMore}
          onMarkRead={handleMarkRead}
        />
      ))}

      {hasMore && (
        <div style={{ padding: '16px 22px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--rule)',
              background: 'var(--card)',
              color: 'var(--ink-2)',
              fontSize: 12,
              cursor: isLoadingMore ? 'default' : 'pointer',
              fontFamily: 'var(--sans)',
              opacity: isLoadingMore ? 0.6 : 1,
            }}
          >
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </button>
          {error && <p style={{ marginTop: 8, fontSize: 12, color: 'var(--danger)' }}>{error}</p>}
        </div>
      )}
    </>
  );
};

type RowProps = {
  notification: InAppNotification;
  now: Date;
  isLast: boolean;
  onMarkRead: (id: string) => void;
};

const NotificationRowItem = ({ notification: n, now, isLast, onMarkRead }: RowProps) => {
  const accent = VARIANT_COLOURS[n.variant ?? 'default'] ?? VARIANT_COLOURS.default;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto',
        gap: 14,
        padding: '16px 22px',
        borderBottom: isLast ? 'none' : '1px solid var(--rule)',
        background: n.is_read ? 'var(--card)' : 'rgba(200,149,35,.05)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--paper)',
          border: `1px solid ${accent}`,
          color: accent,
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--serif)',
          fontSize: 14,
          fontWeight: 500,
        }}
      >
        {n.icon ?? '·'}
      </div>
      {n.action_url ? (
        <Link
          href={n.action_url}
          onClick={() => {
            if (!n.is_read) onMarkRead(n.id);
          }}
          style={{ minWidth: 0, textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-2)' }}>{n.title}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3, lineHeight: 1.5 }}>
            {n.body}
          </div>
        </Link>
      ) : (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-2)' }}>{n.title}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3, lineHeight: 1.5 }}>
            {n.body}
          </div>
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
          alignSelf: 'flex-start',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            color: 'var(--ink-4)',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            whiteSpace: 'nowrap',
          }}
        >
          {formatRelative(n.created_at, now)}
        </span>
        {!n.is_read && (
          <button
            type="button"
            onClick={() => onMarkRead(n.id)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: '1px solid var(--rule)',
              background: 'var(--card)',
              color: 'var(--ink-3)',
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: 'var(--mono)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
            }}
          >
            Mark read
          </button>
        )}
      </div>
    </div>
  );
};
