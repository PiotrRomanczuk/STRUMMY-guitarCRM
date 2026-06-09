import Link from 'next/link';

import type { AssignmentRow } from '@/lib/services/assignments-queries';
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

type Props = {
  rows: AssignmentRow[];
  counts: Record<string, number>;
  asStudent: boolean;
};

export const AssignmentsListEditorial = ({ rows, counts, asStudent }: Props) => {
  const showStudentColumn = !asStudent;
  const cols = showStudentColumn ? '150px 1fr 160px 140px' : '150px 1fr 140px';

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
      <div style={{ marginBottom: 20 }}>
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
        <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>
          {rows.length} total · {counts.pending ?? 0} pending · {counts.in_progress ?? 0} in
          progress · {counts.completed ?? 0} completed · {counts.overdue ?? 0} overdue
        </div>
      </div>

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
            {asStudent
              ? 'No assignments on your desk. Enjoy the quiet.'
              : 'No assignments yet. Create one from a lesson or song.'}
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: cols,
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
              {showStudentColumn && <span>Student / Title</span>}
              {!showStudentColumn && <span>Title</span>}
              {showStudentColumn && <span>Status</span>}
              <span style={{ textAlign: 'right' }}>Status</span>
            </div>
            {rows.map((r, i) => {
              const colour = assignmentStatusColour(r.status);
              return (
                <Link
                  key={r.id}
                  href={`/dashboard/assignments/${r.id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: cols,
                    gap: 14,
                    padding: '14px 20px',
                    borderBottom: i < rows.length - 1 ? '1px solid var(--rule)' : 'none',
                    textDecoration: 'none',
                    color: 'inherit',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 11,
                      color: r.status === 'overdue' ? 'var(--danger)' : 'var(--ink-3)',
                      textTransform: 'uppercase',
                      letterSpacing: '.08em',
                    }}
                  >
                    {formatDate(r.dueDate)}
                  </div>
                  {showStudentColumn && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <Initials name={r.studentName} email={r.studentEmail} />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.studentName ?? r.studentEmail ?? 'Student'}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--serif)',
                            fontStyle: 'italic',
                            fontSize: 12,
                            color: 'var(--ink-3)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.title}
                        </div>
                      </div>
                    </div>
                  )}
                  {!showStudentColumn && (
                    <div
                      style={{
                        fontFamily: 'var(--serif)',
                        fontStyle: 'italic',
                        fontSize: 14,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.title}
                    </div>
                  )}
                  {showStudentColumn && (
                    <span
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 11,
                        color: colour,
                        textTransform: 'uppercase',
                        letterSpacing: '.08em',
                      }}
                    >
                      {assignmentStatusLabel(r.status)}
                    </span>
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
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          background: colour,
                        }}
                      />
                      {assignmentStatusLabel(r.status)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
