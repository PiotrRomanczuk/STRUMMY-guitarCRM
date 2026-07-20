import Link from 'next/link';

import type { AssignmentRow } from '@/lib/services/assignment-list-params';
import { assignmentStatusColour, assignmentStatusLabel } from '@/lib/services/assignments-queries';

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const Initials = ({ name, email }: { name: string | null; email: string | null }) => {
  const src = (name && name.trim()) || (email && email.trim()) || '?';
  const parts = src.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : (parts[0] ?? '?')[0];
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, var(--gold-tint), var(--gold-dim))',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'var(--serif)',
        fontSize: 11,
        fontWeight: 500,
        color: 'var(--ink-2)',
        flexShrink: 0,
      }}
    >
      {initials.toUpperCase()}
    </div>
  );
};

const ellipsis: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

type Props = {
  row: AssignmentRow;
  showStudentColumn: boolean;
  isLast: boolean;
  colsClass: string;
};

// eslint-disable-next-line max-lines-per-function -- editorial row (inline styles)
export const AssignmentListRowEditorial = ({
  row,
  showStudentColumn,
  isLast,
  colsClass,
}: Props) => {
  const colour = assignmentStatusColour(row.effectiveStatus);
  const isOverdue = row.effectiveStatus === 'overdue';

  return (
    <Link
      href={`/dashboard/assignments/${row.id}`}
      className={colsClass}
      style={{
        gap: 14,
        padding: '14px 20px',
        borderBottom: isLast ? 'none' : '1px solid var(--rule)',
        textDecoration: 'none',
        color: 'inherit',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: isOverdue ? 'var(--danger)' : 'var(--ink-3)',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
        }}
      >
        {formatDate(row.dueDate)}
      </div>

      {showStudentColumn ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Initials name={row.studentName} email={row.studentEmail} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, ...ellipsis }}>
              {row.studentName ?? row.studentEmail ?? 'Student'}
            </div>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 12,
                color: 'var(--ink-3)',
                ...ellipsis,
              }}
            >
              {row.title}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, ...ellipsis }}>
          {row.title}
        </div>
      )}

      <div style={{ textAlign: 'right' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '3px 10px',
            borderRadius: 4,
            background: 'rgba(0,0,0,.03)',
            color: colour,
            fontSize: 11,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            fontFamily: 'var(--mono)',
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: colour }} />
          {assignmentStatusLabel(row.effectiveStatus)}
        </span>
      </div>
    </Link>
  );
};
