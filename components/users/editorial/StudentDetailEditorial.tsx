import Link from 'next/link';

import type {
  StudentProfile,
  StudentRecentLesson,
  StudentRepertoireRow,
} from '@/lib/services/student-detail-queries';
import { totalPracticeMinutes } from '@/lib/services/student-detail-queries';
import { ShadowBadge } from './ShadowBadge';
import { InviteShadowButton } from './InviteShadowButton';

const STATUS_COLOURS: Record<string, string> = {
  to_learn: 'var(--ink-4)',
  started: 'var(--info)',
  remembered: 'var(--warn)',
  with_author: '#7a6aa0',
  mastered: 'var(--success)',
};

const STATUS_LABEL: Record<string, string> = {
  to_learn: 'To learn',
  started: 'Started',
  remembered: 'Remembered',
  with_author: 'With author',
  mastered: 'Mastered',
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatMinutes = (m: number): string => {
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

const initialsFor = (name: string | null, email: string | null): string => {
  const src = (name && name.trim()) || (email && email.trim()) || '?';
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0] ?? '?')[0].toUpperCase();
};

const Card = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      background: 'var(--card)',
      border: '1px solid var(--rule)',
      borderRadius: 10,
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

const CardHeader = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--rule)' }}>
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--gold-2)',
        textTransform: 'uppercase',
        letterSpacing: '.14em',
        fontWeight: 500,
      }}
    >
      {eyebrow}
    </div>
    <div
      style={{
        fontFamily: 'var(--serif)',
        fontSize: 22,
        fontWeight: 400,
        letterSpacing: '-0.02em',
        marginTop: 2,
      }}
    >
      {title}
    </div>
  </div>
);

type Props = {
  profile: StudentProfile;
  repertoire: StudentRepertoireRow[];
  lessons: StudentRecentLesson[];
};

export const StudentDetailEditorial = ({ profile, repertoire, lessons }: Props) => {
  const totalMins = totalPracticeMinutes(repertoire);
  const mastered = repertoire.filter((r) => r.status === 'mastered').length;
  const active = repertoire.filter((r) => r.status !== 'to_learn').length;
  const display = profile.fullName ?? profile.email ?? 'Student';

  return (
    <div
      style={{
        background: 'var(--ivory)',
        color: 'var(--ink)',
        fontSize: 13,
        lineHeight: 1.4,
        minHeight: '100%',
        padding: '28px 32px 64px',
      }}
    >
      <div style={{ marginBottom: 22 }}>
        <Link
          href="/dashboard/users"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
          }}
        >
          ← Students
        </Link>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            marginTop: 14,
          }}
        >
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--gold-tint), var(--gold-dim))',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--ink-2)',
              fontFamily: 'var(--serif)',
              fontSize: 36,
              fontWeight: 500,
            }}
          >
            {initialsFor(profile.fullName, profile.email)}
          </div>
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
              Student · joined {formatDate(profile.createdAt)}
            </div>
            <h1
              style={{
                margin: '4px 0 4px',
                fontFamily: 'var(--serif)',
                fontWeight: 400,
                fontSize: 44,
                letterSpacing: '-0.02em',
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              {display}
              {profile.isShadow && <ShadowBadge />}
            </h1>
            {profile.email && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-3)' }}>
                {profile.email}
              </div>
            )}
            {profile.isShadow && (
              <div style={{ marginTop: 12 }}>
                <InviteShadowButton userId={profile.id} defaultEmail={profile.inviteEmail} />
              </div>
            )}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 32 }}>
            <Stat label="Songs in progress" value={String(active)} />
            <Stat label="Mastered" value={String(mastered)} />
            <Stat label="Total practice" value={formatMinutes(totalMins)} />
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 20,
        }}
      >
        <Card>
          <CardHeader eyebrow="Repertoire" title="Songs the student is learning" />
          {repertoire.length === 0 ? (
            <Empty>No songs assigned yet.</Empty>
          ) : (
            <div>
              {repertoire.slice(0, 12).map((row, i) => (
                <Link
                  key={row.songId}
                  href={`/dashboard/songs/${row.songId}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 130px 90px',
                    gap: 12,
                    padding: '12px 22px',
                    borderBottom:
                      i < Math.min(repertoire.length, 12) - 1 ? '1px solid var(--rule)' : 'none',
                    textDecoration: 'none',
                    color: 'inherit',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--serif)',
                        fontStyle: 'italic',
                        fontSize: 14,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.songTitle}
                    </div>
                    {row.songAuthor && (
                      <div
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 11,
                          color: 'var(--ink-4)',
                          marginTop: 2,
                        }}
                      >
                        {row.songAuthor}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: STATUS_COLOURS[row.status] ?? 'var(--ink-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                    }}
                  >
                    {STATUS_LABEL[row.status] ?? row.status}
                  </span>
                  <span
                    style={{
                      textAlign: 'right',
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: 'var(--ink-3)',
                    }}
                  >
                    {formatMinutes(row.totalPracticeMinutes)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader eyebrow="Recent" title="Lessons" />
          {lessons.length === 0 ? (
            <Empty>No lessons yet.</Empty>
          ) : (
            <div>
              {lessons.map((l, i) => (
                <Link
                  key={l.id}
                  href={`/dashboard/lessons/${l.id}`}
                  style={{
                    display: 'block',
                    padding: '12px 22px',
                    borderBottom: i < lessons.length - 1 ? '1px solid var(--rule)' : 'none',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 10,
                      color: 'var(--ink-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                    }}
                  >
                    {formatDate(l.scheduledAt)} · {l.status}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--serif)',
                      fontStyle: 'italic',
                      fontSize: 13,
                      marginTop: 2,
                    }}
                  >
                    {l.title ?? 'Untitled lesson'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--ink-4)',
        textTransform: 'uppercase',
        letterSpacing: '.12em',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: 'var(--serif)',
        fontSize: 28,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        marginTop: 2,
      }}
    >
      {value}
    </div>
  </div>
);

const Empty = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      padding: '28px 24px',
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
