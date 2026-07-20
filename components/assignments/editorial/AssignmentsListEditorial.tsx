import Link from 'next/link';

import { AssignmentListRowEditorial } from '@/components/assignments/editorial/AssignmentsListEditorial.Row';
import { AssignmentsListControls } from '@/components/assignments/editorial/list/AssignmentsListControls';
import type { AssignmentListCounts, AssignmentRow } from '@/lib/services/assignment-list-params';
import type { StudentOption } from '@/lib/services/lesson-form-data';

type Props = {
  rows: AssignmentRow[];
  counts: AssignmentListCounts;
  asStudent: boolean;
  canCreate?: boolean;
  activeStatus?: string;
  sort?: string;
  dir: 'asc' | 'desc';
  search?: string;
  students?: StudentOption[];
  studentId?: string;
};

const colsClass = 'grid grid-cols-1 md:grid-cols-[150px_1fr_140px]';

// eslint-disable-next-line max-lines-per-function -- editorial list shell (inline styles)
export const AssignmentsListEditorial = ({
  rows,
  counts,
  asStudent,
  canCreate,
  activeStatus,
  sort,
  dir,
  search,
  students,
  studentId,
}: Props) => {
  const showStudentColumn = !asStudent;
  const filtered = Boolean(activeStatus || search || studentId);

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
      <div className="ed-page-head" style={{ marginBottom: 20 }}>
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--ink-4)',
              textTransform: 'uppercase',
              letterSpacing: '.16em',
            }}
          >
            {asStudent ? 'From your teacher' : 'Teaching'}
          </div>
          <h1
            style={{
              margin: '4px 0 6px',
              fontFamily: 'var(--serif)',
              fontWeight: 400,
              fontSize: 40,
              letterSpacing: '-0.02em',
              fontStyle: 'italic',
            }}
          >
            Assignments
          </h1>
          {counts.overdue > 0 && (
            <div style={{ color: 'var(--danger)', fontSize: 13 }}>
              {counts.overdue} overdue{' '}
              {counts.overdue === 1 ? 'assignment needs' : 'assignments need'} a nudge.
            </div>
          )}
        </div>
        {canCreate && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/dashboard/assignments/templates"
              className="ed-chip"
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                color: 'var(--ink-4)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                padding: '8px 4px',
              }}
            >
              Templates
            </Link>
            <Link
              href="/dashboard/assignments/new"
              className="ed-chip"
              style={{
                border: '1px solid var(--rule)',
                borderRadius: 8,
                padding: '8px 16px',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                color: 'var(--ink-2)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              + New assignment
            </Link>
          </div>
        )}
      </div>

      <AssignmentsListControls
        counts={counts}
        activeStatus={activeStatus}
        sort={sort}
        dir={dir}
        search={search}
        students={students}
        studentId={studentId}
      />

      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--rule)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {rows.length === 0 ? (
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
            {filtered
              ? 'No assignments match these filters.'
              : asStudent
                ? 'No assignments on your desk. Enjoy the quiet.'
                : 'No assignments yet. Use “New assignment” above to set homework for a student.'}
          </div>
        ) : (
          <>
            <div
              className={`hidden md:grid ${colsClass}`}
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
              <span>Due</span>
              <span>{showStudentColumn ? 'Student / Title' : 'Title'}</span>
              <span style={{ textAlign: 'right' }}>Status</span>
            </div>
            {rows.map((row, i) => (
              <AssignmentListRowEditorial
                key={row.id}
                row={row}
                showStudentColumn={showStudentColumn}
                isLast={i === rows.length - 1}
                colsClass={colsClass}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};
