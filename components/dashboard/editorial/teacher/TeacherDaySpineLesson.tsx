import Link from 'next/link';

import type { DayLesson } from '@/lib/services/teacher-dashboard-queries';

import { formatClock } from './format';
import { StudentInitials } from '../primitives';

type Props = {
  lesson: DayLesson;
  top: number;
  durationMinutes: number;
  hourPx: number;
  isNext: boolean;
};

const endTimeIso = (startIso: string, durationMinutes: number): string => {
  const end = new Date(startIso);
  end.setMinutes(end.getMinutes() + durationMinutes);
  return end.toISOString();
};

export const TeacherDaySpineLesson = ({ lesson, top, durationMinutes, hourPx, isNext }: Props) => {
  const blockHeight = Math.max(72, (durationMinutes / 60) * hourPx - 6);
  const studentDisplay = lesson.studentName ?? lesson.studentEmail ?? 'Student';
  const endIso = endTimeIso(lesson.scheduledAt, durationMinutes);

  return (
    <Link
      href={`/dashboard/lessons/${lesson.id}`}
      style={{
        position: 'absolute',
        left: 24 + 52 + 14,
        right: 24,
        top,
        height: blockHeight,
        border: `1px solid ${isNext ? 'var(--gold-dim)' : 'var(--rule)'}`,
        background: isNext
          ? 'linear-gradient(135deg, var(--gold-tint), var(--card))'
          : 'var(--card)',
        borderRadius: 12,
        padding: '12px 16px',
        boxShadow: isNext
          ? '0 8px 24px -12px rgba(200,149,35,.35)'
          : '0 1px 2px rgba(26,22,19,.04)',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        gap: 14,
        alignItems: 'flex-start',
        zIndex: 2,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <StudentInitials name={lesson.studentName} email={lesson.studentEmail} size={36} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {studentDisplay}
          </span>
        </div>
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-3)',
            marginTop: 3,
          }}
        >
          {formatClock(lesson.scheduledAt)}–{formatClock(endIso)} · {durationMinutes}m
        </div>
        {lesson.songs.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {lesson.songs.slice(0, 2).map((sg) => (
              <span
                key={sg.songId}
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(0,0,0,.04)',
                  fontStyle: 'italic',
                  fontFamily: 'var(--serif)',
                }}
              >
                {sg.songKey && (
                  <span
                    style={{
                      fontFamily: 'var(--mono)',
                      fontStyle: 'normal',
                      color: 'var(--gold-2)',
                      marginRight: 4,
                    }}
                  >
                    {sg.songKey}
                  </span>
                )}
                {sg.title}
              </span>
            ))}
          </div>
        )}
      </div>
      <span
        style={{
          padding: '6px 12px',
          borderRadius: 8,
          background: isNext ? 'var(--ink)' : 'transparent',
          color: isNext ? 'var(--paper)' : 'var(--ink-2)',
          border: isNext ? 'none' : '1px solid var(--rule)',
          fontSize: 11,
          fontWeight: 500,
          fontFamily: 'var(--sans)',
          alignSelf: 'flex-start',
        }}
      >
        {isNext ? 'Prep →' : 'Open'}
      </span>
    </Link>
  );
};
