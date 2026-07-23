import Link from 'next/link';

import type {
  AssignmentDetail,
  AssignmentHistoryEntry,
} from '@/lib/services/assignment-detail-queries';
import { deriveEffectiveStatus } from '@/lib/services/assignment-list-params';
import { assignmentStatusColour, assignmentStatusLabel } from '@/lib/services/assignments-queries';
import { AssignmentSubmitPanel } from './AssignmentDetailEditorial.SubmitPanel';
import { SUBMISSION_TYPE_LABELS, type SubmissionType } from '@/schemas/AssignmentSchema';

const submissionTypeLabel = (value: string): string =>
  SUBMISSION_TYPE_LABELS[value as SubmissionType] ?? 'Self-report';

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

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
  history: AssignmentHistoryEntry[]; // ASG-2 — teacher/admin view only for now
};

export const AssignmentDetailEditorial = ({ assignment, canManage, canAct, history }: Props) => {
  // Same read-time derivation as the list: a past-due open assignment shows
  // OVERDUE here too, not its raw persisted status.
  const effectiveStatus = deriveEffectiveStatus(assignment.dueDate, assignment.status);
  const colour = assignmentStatusColour(effectiveStatus);
  const isOverdue = effectiveStatus === 'overdue';
  const isStudentView = canAct && !canManage;
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
              {assignmentStatusLabel(effectiveStatus)}
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
            ·{' '}
            <span style={isOverdue ? { color: 'var(--danger)', fontWeight: 500 } : undefined}>
              due {formatDate(assignment.dueDate)}
            </span>
          </div>
        </div>

        <div className="grid gap-5 grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
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
            {assignment.dailyTargetMinutes != null && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <span style={{ color: 'var(--ink-4)' }}>Target · </span>
                <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>
                  {assignment.dailyTargetMinutes} min/day
                </span>
              </div>
            )}
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <span style={{ color: 'var(--ink-4)' }}>Submit as · </span>
              <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>
                {submissionTypeLabel(assignment.submissionType)}
              </span>
            </div>
          </Card>

          <Card title={isStudentView ? 'Your practice' : 'Progress'}>
            <AssignmentSubmitPanel
              assignment={assignment}
              canManage={canManage}
              canAct={canAct}
              effectiveStatus={effectiveStatus}
            />
          </Card>

          {canManage && history.length > 0 && (
            <Card title="History">
              <div
                data-testid="assignment-history-timeline"
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}
                  >
                    <span
                      style={{ fontSize: 12, color: 'var(--ink-2)', textTransform: 'capitalize' }}
                    >
                      {entry.label}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 10,
                        color: 'var(--ink-4)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatDateTime(entry.changedAt)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
