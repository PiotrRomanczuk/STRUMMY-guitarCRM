import Link from 'next/link';

import type { LessonRow, LessonsBreakdown } from '@/lib/services/lessons-queries';
import { lessonStatusColour, lessonStatusLabel } from '@/lib/services/lessons-queries';

import { Card } from './primitives';
import { groupLessonsByTime } from './grouping';
import { LessonRowItem } from './LessonsListEditorial.Row';

type Props = {
  lessons: LessonRow[];
  breakdown: LessonsBreakdown;
  canCreate: boolean;
  showStudentColumn: boolean;
  showTeacherColumn: boolean;
  activeStatuses: string[];
  activeSort: 'newest' | 'oldest';
};

const STATUS_KEYS = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;

const buildFilterHref = (current: string[], toggle: string): string => {
  const next = current.includes(toggle)
    ? current.filter((s) => s !== toggle)
    : [...current, toggle];
  const params = new URLSearchParams();
  if (next.length > 0 && next.length < STATUS_KEYS.length) {
    params.set('status', next.join(','));
  }
  const qs = params.toString();
  return qs ? `/dashboard/lessons?${qs}` : '/dashboard/lessons';
};

const eyebrow = (showTeacher: boolean, showStudent: boolean): string =>
  showTeacher ? 'All lessons' : showStudent ? 'Teaching' : 'Your lessons';

const emptyMessage = (showTeacher: boolean, showStudent: boolean): string =>
  showTeacher
    ? 'No lessons scheduled across your teachers yet.'
    : showStudent
      ? 'No lessons yet. Schedule one to get started.'
      : 'You have no lessons scheduled yet.';

const Header = ({
  count,
  canCreate,
  showStudentColumn,
  showTeacherColumn,
  breakdown,
  activeStatuses,
}: {
  count: number;
  canCreate: boolean;
  showStudentColumn: boolean;
  showTeacherColumn: boolean;
  breakdown: LessonsBreakdown;
  activeStatuses: string[];
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
          {eyebrow(showTeacherColumn, showStudentColumn)}
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
          {count} {count === 1 ? 'lesson' : 'lessons'} · grouped by date
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
        flexWrap: 'wrap',
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
        const active = activeStatuses.includes(k);
        return (
          <Link
            key={k}
            href={buildFilterHref(activeStatuses, k)}
            role="button"
            aria-pressed={active}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 99,
              border: `1px solid ${active ? 'var(--ink)' : 'var(--rule)'}`,
              background: active ? 'var(--ink)' : 'transparent',
              fontSize: 12,
              color: active ? 'var(--paper)' : 'var(--ink-3)',
              textDecoration: 'none',
              fontFamily: 'var(--sans)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: lessonStatusColour(k),
              }}
            />
            {lessonStatusLabel(k)}
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: active ? 'rgba(255,255,255,.6)' : 'var(--ink-4)',
              }}
            >
              {breakdown.byStatus[k] ?? 0}
            </span>
          </Link>
        );
      })}
    </div>
  </div>
);

const SectionHeader = ({ label, count }: { label: string; count: number }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '10px 20px',
      background: 'var(--paper)',
      borderBottom: '1px solid var(--rule)',
      fontFamily: 'var(--mono)',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '.14em',
      color: 'var(--ink-4)',
    }}
  >
    <span style={{ color: 'var(--ink-2)' }}>{label}</span>
    <span>·</span>
    <span>{count}</span>
  </div>
);

export const LessonsListEditorial = ({
  lessons,
  breakdown,
  canCreate,
  showStudentColumn,
  showTeacherColumn,
  activeStatuses,
}: Props) => {
  const tableColClass = showStudentColumn
    ? showTeacherColumn
      ? 'grid grid-cols-1 md:grid-cols-[150px_170px_150px_1fr_120px]'
      : 'grid grid-cols-1 md:grid-cols-[160px_1fr_130px_130px]'
    : 'grid grid-cols-1 md:grid-cols-[160px_1fr_130px]';

  const now = new Date();
  const groups = groupLessonsByTime(lessons, now);

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
        activeStatuses={activeStatuses}
        count={lessons.length}
        canCreate={canCreate}
        showStudentColumn={showStudentColumn}
        showTeacherColumn={showTeacherColumn}
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
            {emptyMessage(showTeacherColumn, showStudentColumn)}
          </div>
        ) : (
          <div>
            <div
              className={`hidden md:grid ${tableColClass}`}
              style={{
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
              {showTeacherColumn && <span>Teacher</span>}
              <span>Title</span>
              <span style={{ textAlign: 'right' }}>Status</span>
            </div>
            {groups.map((group) => (
              <div key={group.key}>
                <SectionHeader label={group.label} count={group.lessons.length} />
                {group.lessons.map((l) => (
                  <LessonRowItem
                    key={l.id}
                    lesson={l}
                    showStudentColumn={showStudentColumn}
                    showTeacherColumn={showTeacherColumn}
                    tableColClass={tableColClass}
                    now={now}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
