import Link from 'next/link';

import type { StudentNextLesson, StudentSongRow } from '@/lib/services/student-dashboard-queries';

import { Card, CardHeader, ComingSoonBody } from '../primitives';

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

const formatRelative = (iso: string, now: Date): string => {
  const then = new Date(iso);
  const diffMs = then.getTime() - now.getTime();
  if (diffMs < 0) return 'just passed';
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return 'in under an hour';
  if (hours < 24) return `in ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `in ${days}d`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

const firstName = (fullName: string | null, email: string): string => {
  if (fullName) {
    const f = fullName.trim().split(/\s+/)[0];
    if (f) return f;
  }
  const handle = email.split('@')[0];
  return handle.charAt(0).toUpperCase() + handle.slice(1);
};

const greetingFor = (now: Date): string => {
  const h = now.getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Late night';
};

type Props = {
  fullName: string | null;
  email: string;
  now: Date;
  nextLesson: StudentNextLesson | null;
  songs: StudentSongRow[];
};

export const StudentDashboardEditorial = ({ fullName, email, now, nextLesson, songs }: Props) => (
  <div
    style={{
      background: 'var(--ivory)',
      color: 'var(--ink)',
      fontSize: 13,
      lineHeight: 1.4,
      minHeight: '100%',
      padding: '24px 32px 64px',
    }}
  >
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--ink-4)',
          textTransform: 'uppercase',
          letterSpacing: '.16em',
        }}
      >
        {now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
      </div>
      <h1
        style={{
          margin: '4px 0 6px',
          fontFamily: 'var(--serif)',
          fontWeight: 400,
          fontSize: 40,
          letterSpacing: '-0.02em',
          fontStyle: 'italic',
        }}
      >
        {greetingFor(now)}, {firstName(fullName, email)}.
      </h1>
      <div style={{ fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.5 }}>
        {nextLesson ? (
          <>
            Next lesson{' '}
            <strong style={{ color: 'var(--ink-2)', fontWeight: 500 }}>
              {formatRelative(nextLesson.scheduledAt, now)}
            </strong>{' '}
            {nextLesson.teacherName && <>· with {nextLesson.teacherName}</>}
          </>
        ) : (
          <>No upcoming lessons on your calendar. Keep practicing.</>
        )}
      </div>
    </div>

    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
        gap: 20,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card>
          <CardHeader
            eyebrow={nextLesson ? 'Upcoming' : 'Calendar'}
            title={nextLesson?.title ?? 'Next lesson'}
          />
          {nextLesson ? (
            <Link
              href={`/dashboard/lessons/${nextLesson.id}`}
              style={{
                display: 'block',
                padding: '18px 24px 22px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  color: 'var(--gold-2)',
                  textTransform: 'uppercase',
                  letterSpacing: '.12em',
                }}
              >
                {formatTime(nextLesson.scheduledAt)}
              </div>
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontSize: 20,
                  marginTop: 4,
                  fontStyle: 'italic',
                }}
              >
                {nextLesson.teacherName ?? 'Your teacher'}
              </div>
            </Link>
          ) : (
            <ComingSoonBody note="Once a teacher schedules a lesson with you, it shows up here." />
          )}
        </Card>
        <Card>
          <CardHeader eyebrow="Repertoire" title="Songs you’re working on" />
          {songs.length === 0 ? (
            <ComingSoonBody note="No songs assigned yet. Your teacher can add them from the song list." />
          ) : (
            <div>
              {songs.map((s, i) => (
                <Link
                  key={s.songId}
                  href={`/dashboard/songs/${s.songId}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 120px 70px',
                    gap: 12,
                    padding: '12px 24px',
                    borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
                    borderBottom: '1px solid var(--rule)',
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
                      {s.title}
                    </div>
                    {s.author && (
                      <div
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 11,
                          color: 'var(--ink-4)',
                          marginTop: 2,
                        }}
                      >
                        {s.author}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: STATUS_COLOURS[s.status] ?? 'var(--ink-4)',
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                    }}
                  >
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                  <span
                    style={{
                      textAlign: 'right',
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: 'var(--ink-4)',
                    }}
                  >
                    {s.totalPracticeMinutes}m
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card>
          <CardHeader eyebrow="Streak" title="Practice streak" />
          <ComingSoonBody note="A daily streak chart from practice_sessions lands in a follow-up." />
        </Card>
        <Card>
          <CardHeader eyebrow="Recent" title="Activity" />
          <ComingSoonBody note="Latest practice sessions and lesson recap notes will surface here." />
        </Card>
        <Card>
          <CardHeader eyebrow="Earned" title="Achievements" />
          <ComingSoonBody note="Mastery milestones and skill badges. Coming next." />
        </Card>
      </div>
    </div>
  </div>
);
