import Link from 'next/link';

import type { LessonRow } from '@/lib/services/lessons-queries';
import {
  lessonStatusColour,
  lessonStatusLabel,
  songStatusColour,
} from '@/lib/services/lessons-queries';

import { formatLessonClock, formatLessonDate, formatLessonWeekday } from './format';
import { LessonStatusPill, StudentInitials } from './primitives';

type Props = {
  lesson: LessonRow;
  showStudentColumn: boolean;
  showTeacherColumn: boolean;
  tableColClass: string;
};

const ellipsis = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

const SongsCell = ({ count, statuses }: { count: number; statuses: string[] }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>{count}</span>
    <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{count === 1 ? 'song' : 'songs'}</span>
    {count > 0 && (
      <span style={{ display: 'inline-flex', gap: 2, marginLeft: 2 }} aria-hidden="true">
        {statuses.slice(0, 4).map((status, i) => (
          <span
            key={i}
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: songStatusColour(status),
            }}
          />
        ))}
      </span>
    )}
  </div>
);

const NumberBadge = ({ value }: { value: number }) => (
  <span
    style={{
      fontFamily: 'var(--mono)',
      fontSize: 10,
      color: 'var(--ink-4)',
      padding: '2px 6px',
      background: 'var(--rule-2)',
      borderRadius: 4,
      flexShrink: 0,
    }}
  >
    #{value}
  </span>
);

export const LessonRowItem = ({
  lesson: l,
  showStudentColumn,
  showTeacherColumn,
  tableColClass,
}: Props) => {
  const studentDisplay = l.studentName ?? l.studentEmail ?? 'Student';

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
            fontSize: 10,
            color: 'var(--gold-2)',
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            fontWeight: 500,
          }}
        >
          {formatLessonWeekday(l.scheduledAt)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>
          {formatLessonDate(l.scheduledAt)}
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <NumberBadge value={l.lessonNumber} />
        <span
          style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--ink-2)',
            ...ellipsis,
          }}
        >
          {l.title ?? 'Untitled lesson'}
        </span>
      </div>

      <SongsCell count={l.songCount} statuses={l.songStatuses} />

      <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)' }}>
        {formatLessonClock(l.scheduledAt)}
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
