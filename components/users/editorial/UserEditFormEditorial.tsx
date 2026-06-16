'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export type EditableUser = {
  id: string;
  fullName: string | null;
  email: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isActive: boolean;
};

const fieldLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  color: 'var(--ink-4)',
  textTransform: 'uppercase',
  letterSpacing: '.12em',
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--sans)',
  fontSize: 14,
  color: 'var(--ink)',
};

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span style={{ fontSize: 14 }}>{label}</span>
  </label>
);

export const UserEditFormEditorial = ({ user }: { user: EditableUser }) => {
  const router = useRouter();
  const [fullName, setFullName] = useState(user.fullName ?? '');
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  const [isTeacher, setIsTeacher] = useState(user.isTeacher);
  const [isStudent, setIsStudent] = useState(user.isStudent);
  const [isActive, setIsActive] = useState(user.isActive);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, isAdmin, isTeacher, isStudent, isActive }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Failed to save');
      }
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [user.id, fullName, isAdmin, isTeacher, isStudent, isActive, router]);

  return (
    <div
      style={{
        background: 'var(--ivory)',
        color: 'var(--ink)',
        minHeight: '100%',
        padding: '28px 32px 64px',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <Link
          href={`/dashboard/users/${user.id}`}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
          }}
        >
          ← Profile
        </Link>
        <h1
          style={{
            margin: '12px 0 20px',
            fontFamily: 'var(--serif)',
            fontWeight: 400,
            fontSize: 40,
            letterSpacing: '-0.02em',
            fontStyle: 'italic',
          }}
        >
          Edit {user.fullName ?? user.email ?? 'profile'}
        </h1>

        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--rule)',
            borderRadius: 10,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div>
            <div style={fieldLabelStyle}>Display name</div>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={120}
              style={inputStyle}
            />
          </div>

          <div>
            <div style={fieldLabelStyle}>Roles</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Toggle label="Admin" checked={isAdmin} onChange={setIsAdmin} />
              <Toggle label="Teacher" checked={isTeacher} onChange={setIsTeacher} />
              <Toggle label="Student" checked={isStudent} onChange={setIsStudent} />
            </div>
          </div>

          <div>
            <div style={fieldLabelStyle}>Account</div>
            <Toggle label="Active (login enabled)" checked={isActive} onChange={setIsActive} />
          </div>

          {error && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div
            style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}
          >
            {saved && !error && (
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: 'var(--success)',
                  textTransform: 'uppercase',
                  letterSpacing: '.12em',
                }}
              >
                ✓ Saved
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: isSaving ? 'var(--ink-4)' : 'var(--ink)',
                color: 'var(--paper)',
                fontSize: 13,
                fontWeight: 500,
                cursor: isSaving ? 'wait' : 'pointer',
                fontFamily: 'var(--sans)',
              }}
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
