import Link from 'next/link';

import type { ContinuityLesson } from '@/lib/services/lesson-detail-queries';

import { Card, CardHeader, formatShortDate } from './primitives';

const summarise = (lesson: ContinuityLesson): string => {
  if (lesson.title) return lesson.title;
  if (lesson.notes) {
    const trimmed = lesson.notes.trim().replace(/\s+/g, ' ');
    return trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed;
  }
  return 'Untitled lesson';
};

const ContinuityEntry = ({ lesson, isLast }: { lesson: ContinuityLesson; isLast: boolean }) => (
  <Link
    href={`/dashboard/lessons/${lesson.id}`}
    style={{
      display: 'flex',
      gap: 10,
      padding: '10px 0',
      borderBottom: isLast ? 'none' : '1px solid var(--rule-2)',
      textDecoration: 'none',
      color: 'inherit',
    }}
  >
    <span
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--ink-4)',
        padding: '2px 6px',
        background: 'var(--rule-2)',
        borderRadius: 4,
        height: 'fit-content',
      }}
    >
      #{lesson.lessonTeacherNumber ?? '—'}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--ink-4)' }}>
        {formatShortDate(lesson.scheduledAt)}
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--ink-2)',
          marginTop: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {summarise(lesson)}
      </div>
    </div>
  </Link>
);

export const LessonContinuityCard = ({
  lessons,
  studentFirstName,
}: {
  lessons: ContinuityLesson[];
  studentFirstName: string;
}) => (
  <Card>
    <CardHeader eyebrow="Continuity" title={`With ${studentFirstName}`} />
    <div style={{ padding: '10px 24px 18px' }}>
      {lessons.length === 0 ? (
        <div
          style={{
            padding: '14px 0',
            color: 'var(--ink-4)',
            fontSize: 13,
            fontStyle: 'italic',
            fontFamily: 'var(--serif)',
          }}
        >
          No previous lessons with {studentFirstName}.
        </div>
      ) : (
        lessons.map((lesson, i) => (
          <ContinuityEntry key={lesson.id} lesson={lesson} isLast={i === lessons.length - 1} />
        ))
      )}
    </div>
  </Card>
);
