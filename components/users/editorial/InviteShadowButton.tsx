'use client';

import { useCallback, useState, useTransition } from 'react';

import { inviteShadowUser } from '@/app/dashboard/actions';

type Props = {
  userId: string;
  defaultEmail: string | null;
};

export const InviteShadowButton = ({ userId, defaultEmail }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail ?? '');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSend = useCallback(() => {
    setError('');
    startTransition(async () => {
      try {
        await inviteShadowUser(userId, email);
        setSent(true);
        setIsOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send invite');
      }
    });
  }, [userId, email]);

  if (sent) {
    return (
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--success)',
          textTransform: 'uppercase',
          letterSpacing: '.12em',
        }}
      >
        ✓ Invite sent
      </span>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          border: '1px solid var(--ink)',
          background: 'transparent',
          color: 'var(--ink)',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'var(--sans)',
        }}
      >
        Invite to claim
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="student@email.com"
          style={{
            padding: '8px 10px',
            border: '1px solid var(--rule)',
            borderRadius: 6,
            background: 'var(--paper)',
            fontFamily: 'var(--sans)',
            fontSize: 13,
            color: 'var(--ink)',
            minWidth: 200,
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isPending}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: isPending ? 'var(--ink-4)' : 'var(--ink)',
            color: 'var(--paper)',
            fontSize: 12,
            fontWeight: 500,
            cursor: isPending ? 'wait' : 'pointer',
            fontFamily: 'var(--sans)',
          }}
        >
          {isPending ? 'Sending…' : 'Send'}
        </button>
      </div>
      {error && (
        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--danger)' }}>
          {error}
        </div>
      )}
    </div>
  );
};
