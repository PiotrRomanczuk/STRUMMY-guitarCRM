'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { VALID_STATUS_TRANSITIONS, type AssignmentStatus } from '@/schemas/AssignmentSchema';
import { updateAssignmentStatusAction } from '@/app/actions/assignment-status';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
          const buttonEl = (
            <button
              type="button"
              disabled={busy !== null}
              onClick={next !== 'cancelled' ? () => onClick(next) : undefined}
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

          if (next === 'cancelled') {
            return (
              <AlertDialog key={next}>
                <AlertDialogTrigger asChild>{buttonEl}</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel this assignment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel this assignment? This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onClick('cancelled')}>
                      Yes, cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            );
          }

          return <span key={next}>{buttonEl}</span>;
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
