import Link from 'next/link';

import type { LessonDetail } from '@/lib/services/lesson-detail-queries';

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const STATUS_COLOURS: Record<string, string> = {
  SCHEDULED: 'var(--info)',
  IN_PROGRESS: 'var(--gold-2)',
  COMPLETED: 'var(--success)',
  CANCELLED: 'var(--ink-4)',
};

const lessonStatusLabel = (s: string): string =>
  STATUS_LABELS[s] ?? STATUS_LABELS[s.toUpperCase()] ?? s;
const lessonStatusColour = (s: string): string =>
  STATUS_COLOURS[s] ?? STATUS_COLOURS[s.toUpperCase()] ?? 'var(--ink-4)';

const formatLong = (iso: string): string =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

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

export const LessonDetailEditorial = ({ lesson }: { lesson: LessonDetail }) => {
  const colour = lessonStatusColour(lesson.status);
  const studentDisplay = lesson.studentName ?? lesson.studentEmail ?? 'Student';

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
      <div style={{ maxWidth: 980, margin: '0 auto' }}>
        <Link
          href="/dashboard/lessons"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
          }}
        >
          ← Lessons
        </Link>
        <div style={{ marginTop: 14, marginBottom: 24 }}>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--ink-4)',
              textTransform: 'uppercase',
              letterSpacing: '.16em',
            }}
          >
            Lesson · {formatLong(lesson.scheduledAt)}
          </div>
          <h1
            style={{
              margin: '6px 0 8px',
              fontFamily: 'var(--serif)',
              fontWeight: 400,
              fontSize: 44,
              letterSpacing: '-0.02em',
              fontStyle: 'italic',
            }}
          >
            {lesson.title ?? 'Untitled lesson'}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--ink-3)' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: 4,
                background: 'rgba(0,0,0,.03)',
                color: colour,
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                fontFamily: 'var(--mono)',
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: colour }} />
              {lessonStatusLabel(lesson.status)}
            </span>
            <span>
              with{' '}
              <Link
                href={`/dashboard/users/${lesson.studentId}`}
                style={{ color: 'var(--ink-2)', textDecoration: 'none', fontWeight: 500 }}
              >
                {studentDisplay}
              </Link>
            </span>
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
            <CardHeader
              eyebrow="Repertoire"
              title={`Songs in this lesson · ${lesson.songs.length}`}
            />
            {lesson.songs.length === 0 ? (
              <div
                style={{
                  padding: '32px 24px',
                  textAlign: 'center',
                  color: 'var(--ink-4)',
                  fontStyle: 'italic',
                  fontFamily: 'var(--serif)',
                  fontSize: 14,
                }}
              >
                No songs attached to this lesson yet.
              </div>
            ) : (
              lesson.songs.map((s, i) => (
                <Link
                  key={s.songId}
                  href={`/dashboard/songs/${s.songId}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 90px',
                    gap: 12,
                    padding: '14px 22px',
                    borderBottom: i < lesson.songs.length - 1 ? '1px solid var(--rule)' : 'none',
                    textDecoration: 'none',
                    color: 'inherit',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: 'linear-gradient(135deg, var(--gold-dim), var(--gold-2))',
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      fontFamily: 'var(--serif)',
                      fontSize: 11,
                      fontWeight: 500,
                    }}
                  >
                    {s.key ?? '·'}
                  </div>
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
                  {s.status && (
                    <span
                      style={{
                        textAlign: 'right',
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        color: 'var(--ink-4)',
                        textTransform: 'uppercase',
                        letterSpacing: '.08em',
                      }}
                    >
                      {s.status}
                    </span>
                  )}
                </Link>
              ))
            )}
          </Card>

          <Card>
            <CardHeader eyebrow="Lesson record" title="Notes" />
            <div
              style={{
                padding: '20px 24px 24px',
                fontFamily: 'var(--serif)',
                fontSize: 14,
                lineHeight: 1.65,
                color: 'var(--ink-2)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {lesson.notes ?? (
                <span
                  style={{
                    fontStyle: 'italic',
                    color: 'var(--ink-4)',
                  }}
                >
                  No notes captured from this lesson yet. Add them from the edit view.
                </span>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
