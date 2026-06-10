import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from '@/app/actions/notifications';
import type { NotificationRow } from '@/lib/services/notifications-queries';
import { countUnread } from '@/lib/services/notifications-queries';

const VARIANT_COLOURS: Record<string, string> = {
  default: 'var(--ink-3)',
  success: 'var(--success)',
  warning: 'var(--warn)',
  error: 'var(--danger)',
  info: 'var(--info)',
};

const formatRelative = (iso: string, now: Date): string => {
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

type Props = {
  notifications: NotificationRow[];
  now: Date;
};

export const NotificationsEditorial = ({ notifications, now }: Props) => {
  const unread = countUnread(notifications);

  return (
    <div
      style={{
        background: 'var(--ivory)',
        color: 'var(--ink)',
        fontSize: 13,
        lineHeight: 1.4,
        minHeight: '100%',
        padding: '32px 32px 64px',
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--ink-4)',
                textTransform: 'uppercase',
                letterSpacing: '.16em',
              }}
            >
              Inbox
            </div>
            <h1
              style={{
                margin: '4px 0 4px',
                fontFamily: 'var(--serif)',
                fontWeight: 400,
                fontSize: 44,
                letterSpacing: '-0.02em',
                fontStyle: 'italic',
              }}
            >
              Notifications
            </h1>
            <div style={{ fontSize: 14, color: 'var(--ink-3)' }}>
              {unread === 0 ? (
                <>All caught up.</>
              ) : (
                <>
                  <strong style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{unread}</strong>{' '}
                  unread
                </>
              )}
            </div>
          </div>
          {unread > 0 && (
            <form action={markAllNotificationsReadAction}>
              <button
                type="submit"
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--rule)',
                  background: 'var(--card)',
                  color: 'var(--ink-2)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'var(--sans)',
                }}
              >
                Mark all read
              </button>
            </form>
          )}
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--rule)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {notifications.length === 0 ? (
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
              No notifications yet. Updates about lessons, assignments, and practice will arrive
              here.
            </div>
          ) : (
            notifications.map((n, i) => {
              const accent = VARIANT_COLOURS[n.variant] ?? VARIANT_COLOURS.default;
              return (
                <div
                  key={n.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr auto',
                    gap: 14,
                    padding: '16px 22px',
                    borderBottom: i < notifications.length - 1 ? '1px solid var(--rule)' : 'none',
                    background: n.isRead ? 'var(--card)' : 'rgba(200,149,35,.05)',
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
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--ink-2)',
                      }}
                    >
                      {n.title}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--ink-3)',
                        marginTop: 3,
                        lineHeight: 1.5,
                      }}
                    >
                      {n.body}
                    </div>
                  </div>
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
                      {formatRelative(n.createdAt, now)}
                    </span>
                    {!n.isRead && (
                      <form action={markNotificationReadAction}>
                        <input type="hidden" name="id" value={n.id} />
                        <button
                          type="submit"
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
                      </form>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
