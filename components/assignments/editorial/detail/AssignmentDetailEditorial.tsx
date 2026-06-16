import Link from 'next/link';

import type { AssignmentDetail } from '@/lib/services/assignment-detail-queries';
import { assignmentStatusColour, assignmentStatusLabel } from '@/lib/services/assignments-queries';
import type { AssignmentStatus } from '@/schemas/AssignmentSchema';
import { AssignmentStatusActions } from '../status/AssignmentStatusActions';

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div
    style={{
      background: 'var(--card)',
      border: '1px solid var(--rule)',
      borderRadius: 10,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        padding: '16px 22px 12px',
        borderBottom: '1px solid var(--rule)',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '.14em',
        color: 'var(--gold-2)',
      }}
    >
      {title}
    </div>
    <div style={{ padding: '18px 22px 22px' }}>{children}</div>
  </div>
);

type Props = {
  assignment: AssignmentDetail;
  canManage: boolean; // teacher/admin
  canAct: boolean; // owning student or manager — may change status
};

export const AssignmentDetailEditorial = ({ assignment, canManage, canAct }: Props) => {
  const colour = assignmentStatusColour(assignment.status);
  const studentDisplay = assignment.studentName ?? assignment.studentEmail ?? 'Student';

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
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <Link
          href="/dashboard/assignments"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
          }}
        >
          ← Assignments
        </Link>

        <div style={{ marginTop: 14, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
              {assignmentStatusLabel(assignment.status)}
            </span>
            {canManage && (
              <Link
                href={`/dashboard/assignments/${assignment.id}/edit`}
                style={{
                  marginLeft: 'auto',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--ink-3)',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '.1em',
                }}
              >
                Edit
              </Link>
            )}
          </div>
          <h1
            style={{
              margin: '10px 0 8px',
              fontFamily: 'var(--serif)',
              fontWeight: 400,
              fontSize: 40,
              letterSpacing: '-0.02em',
              fontStyle: 'italic',
            }}
          >
            {assignment.title}
          </h1>
          <div style={{ color: 'var(--ink-3)' }}>
            for{' '}
            <Link
              href={`/dashboard/users/${assignment.studentId}`}
              style={{ color: 'var(--ink-2)', textDecoration: 'none', fontWeight: 500 }}
            >
              {studentDisplay}
            </Link>{' '}
            · due {formatDate(assignment.dueDate)}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
            gap: 20,
          }}
        >
          <Card title="Brief">
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 14,
                lineHeight: 1.65,
                color: 'var(--ink-2)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {assignment.description ?? (
                <span style={{ fontStyle: 'italic', color: 'var(--ink-4)' }}>
                  No description provided.
                </span>
              )}
            </div>
            {assignment.song && (
              <div style={{ marginTop: 16, fontSize: 13 }}>
                <span style={{ color: 'var(--ink-4)' }}>Song · </span>
                <Link
                  href={`/dashboard/songs/${assignment.song.id}`}
                  style={{ color: 'var(--ink-2)', textDecoration: 'none', fontWeight: 500 }}
                >
                  {assignment.song.title}
                  {assignment.song.author ? ` — ${assignment.song.author}` : ''}
                </Link>
              </div>
            )}
            {assignment.lesson && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--ink-4)' }}>Lesson · </span>
                <Link
                  href={`/dashboard/lessons/${assignment.lesson.id}`}
                  style={{ color: 'var(--ink-2)', textDecoration: 'none', fontWeight: 500 }}
                >
                  {formatDate(assignment.lesson.scheduledAt)}
                </Link>
              </div>
            )}
          </Card>

          <Card title="Progress">
            {canAct ? (
              <AssignmentStatusActions
                assignmentId={assignment.id}
                currentStatus={assignment.status as AssignmentStatus}
                canManage={canManage}
              />
            ) : (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>
                Status: {assignmentStatusLabel(assignment.status)}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
