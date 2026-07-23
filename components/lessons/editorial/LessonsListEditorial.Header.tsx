import Link from 'next/link';

import type { LessonsBreakdown } from '@/lib/services/lessons-queries';

import { eyebrowStyle, FilterRow } from './LessonsListEditorial.Filters';
import type { LessonsListState } from './LessonsListEditorial.helpers';

type Props = {
  count: number;
  canCreate: boolean;
  showStudentColumn: boolean;
  showTeacherColumn: boolean;
  breakdown: LessonsBreakdown;
  state: LessonsListState;
  years: number[];
};

const eyebrow = (showTeacher: boolean, showStudent: boolean): string =>
  showTeacher ? 'All lessons' : showStudent ? 'Teaching' : 'Your lessons';

const summaryLine = (count: number, state: LessonsListState): string => {
  const noun = count === 1 ? 'lesson' : 'lessons';
  const mode = state.flat
    ? `sorted by ${state.sort === 'newest' ? 'newest' : 'oldest'} first`
    : 'grouped by date';
  return `${count} ${noun} · ${mode}`;
};

const TitleBlock = ({
  count,
  canCreate,
  showStudentColumn,
  showTeacherColumn,
  state,
}: {
  count: number;
  canCreate: boolean;
  showStudentColumn: boolean;
  showTeacherColumn: boolean;
  state: LessonsListState;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 18,
    }}
  >
    <div>
      <div style={eyebrowStyle}>{eyebrow(showTeacherColumn, showStudentColumn)}</div>
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
        {summaryLine(count, state)}
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
);

export const LessonsListHeader = ({
  count,
  canCreate,
  showStudentColumn,
  showTeacherColumn,
  breakdown,
  state,
  years,
}: Props) => (
  <div style={{ padding: '0 0 18px' }}>
    <TitleBlock
      count={count}
      canCreate={canCreate}
      showStudentColumn={showStudentColumn}
      showTeacherColumn={showTeacherColumn}
      state={state}
    />
    <FilterRow breakdown={breakdown} state={state} years={years} />
  </div>
);
