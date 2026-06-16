'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { VALID_STATUS_TRANSITIONS, type AssignmentStatus } from '@/schemas/AssignmentSchema';
import { updateAssignmentStatusAction } from '@/app/actions/assignment-status';

const LABELS: Record<string, string> = {
  in_progress: 'Start working',
  completed: 'Mark complete',
  cancelled: 'Cancel',
};

// Students may only advance to these states; teachers/admin get the full set.
const STUDENT_TARGETS: AssignmentStatus[] = ['in_progress', 'completed'];

type Props = {
  assignmentId: string;
  currentStatus: AssignmentStatus;
  canManage: boolean; // teacher or admin
};

export const AssignmentStatusActions = ({ assignmentId, currentStatus, canManage }: Props) => {
  const router = useRouter();
  const [busy, setBusy] = useState<AssignmentStatus | null>(null);
  const [error, setError] = useState('');

  const transitions = (VALID_STATUS_TRANSITIONS[currentStatus] ?? []) as AssignmentStatus[];
  const targets = canManage ? transitions : transitions.filter((t) => STUDENT_TARGETS.includes(t));

  const onClick = useCallback(
    async (next: AssignmentStatus) => {
      if (busy) return;
      setBusy(next);
      setError('');
      const result = await updateAssignmentStatusAction(assignmentId, next);
      setBusy(null);
      if ('error' in result) {
        setError(result.error);
        return;
      }
      router.refresh();
    },
    [assignmentId, busy, router]
  );

  if (targets.length === 0) {
    return (
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--ink-4)',
          textTransform: 'uppercase',
          letterSpacing: '.1em',
        }}
      >
        No further actions
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {targets.map((next) => {
          const isPrimary = next === 'completed' || next === 'in_progress';
          return (
            <button
              key={next}
              type="button"
              disabled={busy !== null}
              onClick={() => onClick(next)}
              style={{
                border: isPrimary ? 'none' : '1px solid var(--rule)',
                background: isPrimary ? 'var(--ink)' : 'transparent',
                color: isPrimary ? 'var(--ivory)' : 'var(--ink-3)',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 500,
                cursor: busy ? 'wait' : 'pointer',
                fontFamily: 'var(--mono)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                opacity: busy && busy !== next ? 0.5 : 1,
              }}
            >
              {busy === next ? 'Saving…' : (LABELS[next] ?? next)}
            </button>
          );
        })}
      </div>
      {error && (
        <span style={{ color: 'var(--danger)', fontSize: 12, fontFamily: 'var(--mono)' }}>
          {error}
        </span>
      )}
    </div>
  );
};
