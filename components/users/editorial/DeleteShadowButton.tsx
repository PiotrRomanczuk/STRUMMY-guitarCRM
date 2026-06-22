'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { deleteShadowUser } from '@/app/dashboard/actions';

type Props = { userId: string };

export const DeleteShadowButton = ({ userId }: Props) => {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleDelete = useCallback(() => {
    setError('');
    startTransition(async () => {
      try {
        await deleteShadowUser(userId);
        router.push('/dashboard/users');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete');
        setConfirming(false);
      }
    });
  }, [userId, router]);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        style={{
          background: 'none',
          border: '1px solid var(--danger)',
          borderRadius: 6,
          padding: '6px 12px',
          cursor: 'pointer',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--danger)',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
        }}
      >
        Delete
      </button>
    );
  }

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
        Confirm delete?
      </span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        style={{
          background: 'var(--danger)',
          border: 'none',
          borderRadius: 6,
          padding: '6px 12px',
          cursor: isPending ? 'wait' : 'pointer',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: '#fff',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
        }}
      >
        {isPending ? 'Deleting…' : 'Yes, delete'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        style={{
          background: 'none',
          border: '1px solid var(--rule)',
          borderRadius: 6,
          padding: '6px 12px',
          cursor: 'pointer',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--ink-3)',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
        }}
      >
        Cancel
      </button>
      {error && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--danger)' }}>
          {error}
        </span>
      )}
    </span>
  );
};
