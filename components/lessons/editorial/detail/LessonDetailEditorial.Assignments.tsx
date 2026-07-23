import Link from 'next/link';

import type { LessonAssignment } from '@/lib/services/lesson-detail-queries';

import { Card, CardHeader, formatShortDate } from './primitives';

const AddLink = () => (
  <Link
    href="/dashboard/assignments/new"
    style={{
      fontFamily: 'var(--mono)',
      fontSize: 11,
      color: 'var(--gold-2)',
      textDecoration: 'none',
      textTransform: 'uppercase',
      letterSpacing: '.1em',
    }}
  >
    + Add
  </Link>
);

const AssignmentEntry = ({ item, isLast }: { item: LessonAssignment; isLast: boolean }) => {
  const isDone = item.status === 'completed';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '11px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--rule)',
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          marginTop: 2,
          borderRadius: 4,
          border: '1.5px solid var(--rule)',
          background: isDone ? 'var(--success)' : 'var(--card)',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontSize: 10,
          flex: '0 0 16px',
        }}
        aria-hidden
      >
        {isDone ? '✓' : ''}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          href={`/dashboard/assignments/${item.id}`}
          style={{
            fontSize: 13,
            lineHeight: 1.4,
            textDecoration: isDone ? 'line-through' : 'none',
            color: isDone ? 'var(--ink-4)' : 'var(--ink-2)',
            display: 'block',
          }}
        >
          {item.title}
        </Link>
        {item.dueDate && (
          <div
            style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}
          >
            Due {formatShortDate(item.dueDate)}
          </div>
        )}
      </div>
    </div>
  );
};

export const LessonAssignmentsCard = ({
  assignments,
  canEdit,
}: {
  assignments: LessonAssignment[];
  canEdit: boolean;
}) => (
  <Card>
    <CardHeader
      eyebrow="Homework"
      title={`Assignments · ${assignments.length}`}
      action={canEdit ? <AddLink /> : undefined}
    />
    <div style={{ padding: '6px 24px 18px' }}>
      {assignments.length === 0 ? (
        <div
          style={{
            padding: '14px 0',
            color: 'var(--ink-4)',
            fontSize: 13,
            fontStyle: 'italic',
            fontFamily: 'var(--serif)',
          }}
        >
          No homework attached to this lesson.
        </div>
      ) : (
        assignments.map((item, i) => (
          <AssignmentEntry key={item.id} item={item} isLast={i === assignments.length - 1} />
        ))
      )}
    </div>
  </Card>
);
