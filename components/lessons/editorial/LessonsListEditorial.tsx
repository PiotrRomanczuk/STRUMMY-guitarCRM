import Link from 'next/link';

import type { LessonRow, LessonsBreakdown } from '@/lib/services/lessons-queries';
import { lessonStatusColour, lessonStatusLabel } from '@/lib/services/lessons-queries';

import { formatLessonClock, formatLessonDate, formatLessonWeekday } from './format';
import { Card, LessonStatusPill, StudentInitials } from './primitives';

type Props = {
  lessons: LessonRow[];
  breakdown: LessonsBreakdown;
  canCreate: boolean;
  showStudentColumn: boolean;
};

const STATUS_KEYS = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;

const Header = ({
  count,
  canCreate,
  showStudentColumn,
  breakdown,
}: {
  count: number;
  canCreate: boolean;
  showStudentColumn: boolean;
  breakdown: LessonsBreakdown;
}) => (
  <div style={{ padding: '0 0 18px' }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 18,
      }}
    >
      <div>
        <div
          style={{
            color: 'var(--ink-4)',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '.16em',
            fontFamily: 'var(--mono)',
          }}
        >
          {showStudentColumn ? 'Teaching' : 'Your lessons'}
        </div>
        <h1
          style={{
            margin: '4px 0 0',
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: 40,
            letterSpacing: '-0.02em',
            fontStyle: 'italic',
          }}
        >
          Lessons
        </h1>
        <div style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 6 }}>
          {count} {count === 1 ? 'lesson' : 'lessons'} · newest first
        </div>
      </div>
      {canCreate && (
        <Link
          href="/dashboard/lessons/new"
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: 'var(--ink)',
            color: 'var(--paper)',
            fontSize: 13,
            fontWeight: 500,
            textDecoration: 'none',
            fontFamily: 'var(--sans)',
          }}
        >
          + New lesson
        </Link>
      )}
    </div>
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        padding: '10px 14px',
        background: 'var(--card)',
        border: '1px solid var(--rule)',
        borderRadius: 10,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: 'var(--ink-4)',
          textTransform: 'uppercase',
          letterSpacing: '.12em',
          fontFamily: 'var(--mono)',
          marginRight: 4,
        }}
      >
        Status
      </span>
      {STATUS_KEYS.map((k) => {
        const label = lessonStatusLabel(k);
        const colour = lessonStatusColour(k);
        return (
          <span
            key={k}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 99,
              border: '1px solid var(--rule)',
              fontSize: 12,
              color: 'var(--ink-3)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: colour,
              }}
            />
            {label}
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>
              {breakdown.byStatus[k] ?? 0}
            </span>
          </span>
        );
      })}
    </div>
  </div>
);

export const LessonsListEditorial = ({
  lessons,
  breakdown,
  canCreate,
  showStudentColumn,
}: Props) => {
  const tableColumns = showStudentColumn ? '160px 1fr 130px 130px' : '160px 1fr 130px';

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
      <Header
        count={lessons.length}
        canCreate={canCreate}
        showStudentColumn={showStudentColumn}
        breakdown={breakdown}
      />
      <Card>
        {lessons.length === 0 ? (
          <div
            style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--ink-4)',
              fontStyle: 'italic',
              fontFamily: 'var(--serif)',
              fontSize: 15,
            }}
          >
            No lessons on file. Schedule one to get started.
          </div>
        ) : (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: tableColumns,
                gap: 14,
                padding: '12px 20px',
                borderBottom: '1px solid var(--rule)',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '.12em',
                color: 'var(--ink-4)',
              }}
            >
              <span>Date</span>
              {showStudentColumn && <span>Student</span>}
              <span>Title</span>
              <span style={{ textAlign: 'right' }}>Status</span>
            </div>
            {lessons.map((l) => {
              const studentDisplay = l.studentName ?? l.studentEmail ?? 'Student';
              const colour = lessonStatusColour(l.status);
              const label = lessonStatusLabel(l.status);
              return (
                <Link
                  key={l.id}
                  href={`/dashboard/lessons/${l.id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: tableColumns,
                    gap: 14,
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--rule)',
                    textDecoration: 'none',
                    color: 'inherit',
                    alignItems: 'center',
                  }}
                >
                  <div>
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
                    <div style={{ fontSize: 13, marginTop: 2 }}>
                      {formatLessonDate(l.scheduledAt)}
                    </div>
                  </div>
                  {showStudentColumn && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <StudentInitials name={l.studentName} email={l.studentEmail} size={28} />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {studentDisplay}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      fontFamily: 'var(--serif)',
                      fontStyle: 'italic',
                      fontSize: 14,
                      color: 'var(--ink-2)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {l.title ?? 'Untitled lesson'}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <LessonStatusPill label={label} colour={colour} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};
