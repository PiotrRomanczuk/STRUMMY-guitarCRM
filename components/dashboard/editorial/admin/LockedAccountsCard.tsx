'use client';

import { useCallback, useState, useTransition } from 'react';

import { unlockAccount, type LockedAccount } from '@/app/actions/admin/lockout';

import { Card, CardHeader } from '../primitives';

type Props = {
  accounts: LockedAccount[];
};

const formatLockedUntil = (iso: string): string =>
  new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export const LockedAccountsCard = ({ accounts }: Props) => {
  const [rows, setRows] = useState(accounts);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  const handleUnlock = useCallback((id: string) => {
    setError('');
    setPendingId(id);
    startTransition(async () => {
      try {
        const result = await unlockAccount(id);
        if (!result.success) {
          setError(result.error ?? 'Failed to unlock account');
          return;
        }
        setRows((prev) => prev.filter((row) => row.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to unlock account');
      } finally {
        setPendingId(null);
      }
    });
  }, []);

  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader
        eyebrow="Security"
        title="Locked accounts"
        action={
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-4)' }}>
            {rows.length}
          </span>
        }
      />
      <div data-testid="locked-accounts-list">
        {rows.map((account, i) => (
          <div
            key={account.id}
            data-testid={`locked-account-${account.id}`}
            style={{
              padding: '12px 22px',
              borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
              borderBottom: '1px solid var(--rule)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-2)' }}>
                {account.fullName ?? account.email}
              </span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>
                {account.failedLoginAttempts} failed attempts · locked until{' '}
                {formatLockedUntil(account.lockedUntil)}
              </span>
            </div>
            <button
              type="button"
              data-testid={`unlock-account-${account.id}`}
              onClick={() => handleUnlock(account.id)}
              disabled={pendingId === account.id}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid var(--ink)',
                background: 'transparent',
                color: 'var(--ink)',
                fontSize: 11,
                fontWeight: 500,
                cursor: pendingId === account.id ? 'wait' : 'pointer',
                fontFamily: 'var(--sans)',
                whiteSpace: 'nowrap',
              }}
            >
              {pendingId === account.id ? 'Unlocking…' : 'Unlock'}
            </button>
          </div>
        ))}
      </div>
      {error && (
        <div
          data-testid="locked-accounts-error"
          style={{
            padding: '10px 22px',
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--danger)',
          }}
        >
          {error}
        </div>
      )}
    </Card>
  );
};
