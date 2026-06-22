'use client';

import { useCallback, useState, useTransition } from 'react';

import { inviteShadowUser } from '@/app/dashboard/actions';

type Props = {
  userId: string;
  inviteEmail: string;
};

export const InlineInviteButton = ({ userId, inviteEmail }: Props) => {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleInvite = useCallback(() => {
    setError('');
    startTransition(async () => {
      try {
        await inviteShadowUser(userId, inviteEmail);
        setSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed');
      }
    });
  }, [userId, inviteEmail]);

  if (sent) {
    return (
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--success)',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
        }}
      >
        ✓ Sent
      </span>
    );
  }

  return (
    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button
        type="button"
        onClick={handleInvite}
        disabled={isPending}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: isPending ? 'wait' : 'pointer',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: isPending ? 'var(--ink-4)' : 'var(--gold-2)',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
        }}
      >
        {isPending ? 'Sending…' : 'Invite →'}
      </button>
      {error && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--danger)' }}>
          {error}
        </span>
      )}
    </span>
  );
};
