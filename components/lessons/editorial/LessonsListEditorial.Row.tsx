import Link from 'next/link';
import { formatDistance } from 'date-fns';

import type { LessonRow } from '@/lib/services/lessons-queries';
import { lessonStatusColour, lessonStatusLabel } from '@/lib/services/lessons-queries';

import { formatLessonClock, formatLessonDate, formatLessonWeekday } from './format';
import { LessonStatusPill, StudentInitials } from './primitives';

type Props = {
  lesson: LessonRow;
  showStudentColumn: boolean;
  showTeacherColumn: boolean;
  tableColClass: string;
  now: Date;
};

const ellipsis = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

export const LessonRowItem = ({
  lesson: l,
  showStudentColumn,
  showTeacherColumn,
  tableColClass,
  now,
}: Props) => {
  const studentDisplay = l.studentName ?? l.studentEmail ?? 'Student';
  const relative = formatDistance(new Date(l.scheduledAt), now, { addSuffix: true });

  return (
    <Link
      href={`/dashboard/lessons/${l.id}`}
      className={tableColClass}
      style={{
        gap: 14,
        padding: '14px 20px',
        borderBottom: '1px solid var(--rule)',
        textDecoration: 'none',
        color: 'inherit',
        alignItems: 'center',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
          }}
        >
          {formatLessonWeekday(l.scheduledAt)} · {formatLessonClock(l.scheduledAt)}
        </div>
        <div style={{ fontSize: 13, marginTop: 2 }}>{formatLessonDate(l.scheduledAt)}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2, fontStyle: 'italic' }}>
          {relative}
        </div>
      </div>

      {showStudentColumn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <StudentInitials name={l.studentName} email={l.studentEmail} size={28} />
          <span style={{ fontSize: 13, fontWeight: 500, ...ellipsis }}>{studentDisplay}</span>
        </div>
      )}

      {showTeacherColumn && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <StudentInitials name={l.teacherName} email={l.teacherEmail} size={28} />
          <span style={{ fontSize: 13, color: 'var(--ink-3)', ...ellipsis }}>
            {l.teacherName ?? l.teacherEmail ?? 'Teacher'}
          </span>
        </div>
      )}

      <div
        style={{
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--ink-2)',
          ...ellipsis,
        }}
      >
        {l.title ?? 'Untitled lesson'}
      </div>

      <div style={{ textAlign: 'right' }}>
        <LessonStatusPill
          label={lessonStatusLabel(l.status)}
          colour={lessonStatusColour(l.status)}
        />
      </div>
    </Link>
  );
};
