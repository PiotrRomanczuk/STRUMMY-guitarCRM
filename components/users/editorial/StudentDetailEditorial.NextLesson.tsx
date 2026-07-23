import Link from 'next/link';

import type { NextLesson } from '@/lib/services/student-health-queries';
import { Card, CardHeader, Empty, formatDate } from './StudentDetailEditorial.shared';

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const linkStyle: React.CSSProperties = {
  fontFamily: 'var(--sans)',
  fontSize: 12,
  fontWeight: 500,
  textDecoration: 'none',
};

type Props = { lesson: NextLesson };

/** Next upcoming lesson with a reschedule shortcut; nudges to schedule when empty. */
export const NextLessonCard = ({ lesson }: Props) => (
  <Card>
    <CardHeader eyebrow="Up next" title="Next lesson" />
    {!lesson ? (
      <div style={{ padding: '18px 24px 22px' }}>
        <Empty>No upcoming lesson.</Empty>
        <Link
          href="/dashboard/lessons/new"
          className="ed-btn-ghost"
          style={{ ...linkStyle, display: 'inline-block', color: 'var(--ink)' }}
        >
          Schedule lesson →
        </Link>
      </div>
    ) : (
      <div style={{ padding: '18px 24px 20px' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 20 }}>
          {formatDate(lesson.scheduledAt)}
        </div>
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-3)',
            marginTop: 4,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
          }}
        >
          {formatTime(lesson.scheduledAt)} · {lesson.status}
        </div>
        {lesson.title && (
          <div style={{ fontStyle: 'italic', fontFamily: 'var(--serif)', marginTop: 6 }}>
            {lesson.title}
          </div>
        )}
        <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
          <Link
            href={`/dashboard/lessons/${lesson.id}/edit`}
            style={{ ...linkStyle, color: 'var(--gold-2)' }}
          >
            Reschedule now →
          </Link>
          <Link
            href={`/dashboard/lessons/${lesson.id}`}
            style={{ ...linkStyle, color: 'var(--ink-3)' }}
          >
            View lesson
          </Link>
        </div>
      </div>
    )}
  </Card>
);
