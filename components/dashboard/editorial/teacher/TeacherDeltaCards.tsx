import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

import type {
  StudioActivityItem,
  StudioActivityType,
} from '@/lib/services/teacher-dashboard-activity';
import { relativeTimeLabel } from '@/lib/services/teacher-dashboard-activity';

import { Card, CardHeader, StudentInitials } from '../primitives';

export type SongOfWeekView = {
  id: string;
  title: string;
  author: string | null;
  level: string | null;
  songKey: string | null;
  capoFret: number | null;
  tempo: number | null;
  teacherMessage: string | null;
};

const Empty = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      padding: '24px',
      textAlign: 'center',
      color: 'var(--ink-4)',
      fontStyle: 'italic',
      fontFamily: 'var(--serif)',
      fontSize: 14,
    }}
  >
    {children}
  </div>
);

const QUICK_ACTIONS = [
  { href: '/dashboard/lessons/new', label: 'New lesson' },
  { href: '/dashboard/assignments/new', label: 'Assignment' },
  { href: '/dashboard/songs/new', label: 'Add song' },
  { href: '/dashboard/users/new', label: 'Invite student' },
] as const;

export const QuickActionsCard = () => (
  <Card>
    <CardHeader eyebrow="Shortcuts" title="Quick actions" />
    <div
      style={{
        padding: '16px 22px 20px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}
    >
      {QUICK_ACTIONS.map((a) => (
        <Link
          key={a.href}
          href={a.href}
          className="ed-quick-action"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            border: '1px solid var(--rule)',
            borderRadius: 8,
            background: 'var(--card)',
            color: 'var(--ink-2)',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--gold-2)',
              flexShrink: 0,
            }}
          />
          {a.label}
        </Link>
      ))}
    </div>
  </Card>
);

const VERB_COLOR: Record<StudioActivityType, string> = {
  practice: 'var(--info)',
  assignment: 'var(--gold-2)',
  lesson: 'var(--ink-2)',
};

export const ActivityFeedCard = ({ items, now }: { items: StudioActivityItem[]; now: Date }) => (
  <Card>
    <CardHeader eyebrow="Recent across your studio" title="Activity" />
    {items.length === 0 ? (
      <Empty>No studio activity in the last month.</Empty>
    ) : (
      <div>
        {items.map((a, i) => (
          <div
            key={a.id}
            className="ed-row"
            style={{
              display: 'grid',
              gridTemplateColumns: '26px minmax(0, 1fr) auto',
              gap: 12,
              alignItems: 'center',
              padding: '10px 22px',
              borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
              borderBottom: '1px solid var(--rule)',
            }}
          >
            <StudentInitials name={a.actorName} email={a.actorEmail} size={26} />
            <div
              style={{
                fontSize: 13,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontWeight: 500 }}>{a.actorName ?? a.actorEmail ?? 'Student'}</span>{' '}
              <span style={{ color: VERB_COLOR[a.type], fontWeight: 500 }}>{a.action}</span>
              {a.object ? (
                <>
                  {' '}
                  <span style={{ fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
                    {a.object}
                  </span>
                </>
              ) : null}
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>
              {relativeTimeLabel(a.occurredAt, now)}
            </span>
          </div>
        ))}
      </div>
    )}
  </Card>
);

const songInitials = (title: string): string => {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  const chars = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : (parts[0] ?? '?').slice(0, 2);
  return chars.toUpperCase();
};

const metaStyle: CSSProperties = { fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' };

export const SongOfWeekCard = ({ song }: { song: SongOfWeekView | null }) => (
  <Card style={{ background: 'linear-gradient(165deg, var(--gold-tint) 0%, var(--card) 45%)' }}>
    <CardHeader eyebrow="Song of the week" title="This week’s pick" />
    {!song ? (
      <Empty>No song of the week selected yet.</Empty>
    ) : (
      <div style={{ padding: '18px 22px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 8,
              background: 'linear-gradient(135deg, var(--danger), var(--gold))',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontFamily: 'var(--serif)',
              fontSize: 22,
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            {songInitials(song.title)}
          </div>
          <div style={{ minWidth: 0 }}>
            <Link
              href={`/dashboard/songs/${song.id}`}
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 20,
                fontWeight: 500,
                lineHeight: 1.15,
                color: 'var(--ink)',
                textDecoration: 'none',
              }}
            >
              {song.title}
            </Link>
            {song.author ? (
              <div style={{ color: 'var(--ink-3)', fontSize: 12, marginTop: 2 }}>{song.author}</div>
            ) : null}
            <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
              {song.songKey ? <span style={metaStyle}>KEY {song.songKey}</span> : null}
              {song.capoFret ? <span style={metaStyle}>CAPO {song.capoFret}</span> : null}
              {song.tempo ? <span style={metaStyle}>♩ {song.tempo}</span> : null}
              {song.level ? (
                <span style={{ ...metaStyle, color: 'var(--gold-2)' }}>
                  {song.level.toUpperCase()}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid var(--rule)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {song.teacherMessage ?? 'Share this pick with your studio.'}
          </span>
          <Link
            href="/dashboard/assignments/new"
            className="ed-assign"
            style={{
              padding: '6px 12px',
              border: 'none',
              background: 'var(--ink)',
              color: 'var(--paper)',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 500,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Assign →
          </Link>
        </div>
      </div>
    )}
  </Card>
);
