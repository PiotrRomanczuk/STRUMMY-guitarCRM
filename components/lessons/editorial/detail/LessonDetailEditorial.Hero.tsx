import type { CSSProperties } from 'react';
import Link from 'next/link';

import type { LessonDetail } from '@/lib/services/lesson-detail-queries';

import { formatLong, lessonStatusColour, lessonStatusLabel } from './primitives';

const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  color: 'var(--ink-4)',
  textTransform: 'uppercase',
  letterSpacing: '.16em',
};

const titleStyle: CSSProperties = {
  margin: '6px 0 8px',
  fontFamily: 'var(--serif)',
  fontWeight: 400,
  fontSize: 44,
  letterSpacing: '-0.02em',
  fontStyle: 'italic',
};

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12,
  color: 'var(--ink-3)',
};

const pillBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '3px 10px',
  borderRadius: 4,
  background: 'rgba(0,0,0,.03)',
  fontSize: 11,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  fontFamily: 'var(--mono)',
};

const numberBadgeStyle: CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  color: 'var(--ink-4)',
  padding: '2px 8px',
  background: 'var(--rule-2)',
  borderRadius: 4,
};

export const LessonHero = ({
  lesson,
  studentDisplay,
}: {
  lesson: LessonDetail;
  studentDisplay: string;
}) => {
  const colour = lessonStatusColour(lesson.status);

  return (
    <div style={{ marginTop: 14, marginBottom: 24 }}>
      <div style={eyebrowStyle}>Lesson · {formatLong(lesson.scheduledAt)}</div>
      <h1 style={titleStyle}>{lesson.title ?? 'Untitled lesson'}</h1>
      <div style={rowStyle}>
        <span style={{ ...pillBase, color: colour }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: colour }} />
          {lessonStatusLabel(lesson.status)}
        </span>
        {lesson.lessonTeacherNumber != null && (
          <span style={numberBadgeStyle}>Lesson #{lesson.lessonTeacherNumber}</span>
        )}
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
  );
};
