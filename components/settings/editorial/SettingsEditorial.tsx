'use client';

import { useActionState } from 'react';
import Link from 'next/link';

import { updateProfileNameAction, type ProfileSettingsState } from '@/app/actions/profile-settings';
import { AvatarUpload } from './SettingsEditorial.AvatarUpload';

const INITIAL: ProfileSettingsState = {};

const Card = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      background: 'var(--card)',
      border: '1px solid var(--rule)',
      borderRadius: 10,
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

const CardHeader = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--rule)' }}>
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        color: 'var(--gold-2)',
        textTransform: 'uppercase',
        letterSpacing: '.14em',
        fontWeight: 500,
      }}
    >
      {eyebrow}
    </div>
    <div
      style={{
        fontFamily: 'var(--serif)',
        fontSize: 22,
        fontWeight: 400,
        letterSpacing: '-0.02em',
        marginTop: 2,
      }}
    >
      {title}
    </div>
  </div>
);

const FieldLabel = ({ label }: { label: string }) => (
  <div
    style={{
      fontFamily: 'var(--mono)',
      fontSize: 10,
      color: 'var(--ink-4)',
      textTransform: 'uppercase',
      letterSpacing: '.12em',
      marginBottom: 6,
    }}
  >
    {label}
  </div>
);

const readonlyInputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--mono)',
  fontSize: 13,
  color: 'var(--ink-3)',
};

const editableInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--sans)',
  fontSize: 14,
  color: 'var(--ink)',
};

type Props = {
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  roleLabel: string;
};

export const SettingsEditorial = ({
  userId,
  email,
  fullName,
  phone,
  avatarUrl,
  roleLabel,
}: Props) => {
  const [state, formAction, pending] = useActionState(updateProfileNameAction, INITIAL);

  return (
    <div
      style={{
        background: 'var(--ivory)',
        color: 'var(--ink)',
        fontSize: 13,
        lineHeight: 1.4,
        minHeight: '100%',
        padding: '32px 32px 64px',
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--ink-4)',
              textTransform: 'uppercase',
              letterSpacing: '.16em',
            }}
          >
            Studio
          </div>
          <h1
            style={{
              margin: '4px 0 8px',
              fontFamily: 'var(--serif)',
              fontWeight: 400,
              fontSize: 44,
              letterSpacing: '-0.02em',
              fontStyle: 'italic',
            }}
          >
            Settings
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.55 }}>
            Your profile and how Strummy talks to you.
          </p>
        </div>

        <Card>
          <CardHeader eyebrow="Account" title="Profile" />
          <form
            action={formAction}
            style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <FieldLabel label="Email" />
              <input value={email} disabled style={readonlyInputStyle} />
            </div>
            <div>
              <FieldLabel label="Role" />
              <input value={roleLabel} disabled style={readonlyInputStyle} />
            </div>
            <div>
              <FieldLabel label="Display name" />
              <input
                name="full_name"
                defaultValue={fullName ?? ''}
                placeholder="Your name"
                maxLength={120}
                required
                style={editableInputStyle}
              />
            </div>
            <div>
              <FieldLabel label="Phone" />
              <input
                name="phone"
                type="tel"
                defaultValue={phone ?? ''}
                placeholder="+1 555 123 4567"
                maxLength={50}
                style={editableInputStyle}
              />
            </div>
            <div>
              <FieldLabel label="Avatar" />
              <AvatarUpload userId={userId} initialUrl={avatarUrl} />
              {state.error && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 11,
                    color: 'var(--danger)',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {state.error}
                </div>
              )}
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}
            >
              {state.saved && !state.error && (
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
                type="submit"
                disabled={pending}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: pending ? 'var(--ink-4)' : 'var(--ink)',
                  color: 'var(--paper)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: pending ? 'wait' : 'pointer',
                  fontFamily: 'var(--sans)',
                }}
              >
                {pending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader eyebrow="Inbox" title="Notifications" />
          <Link
            href="/dashboard/settings/notifications"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Notification preferences</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>
                Email and in-app reminders for lessons, assignments, and practice.
              </div>
            </div>
            <span style={{ color: 'var(--ink-4)', fontSize: 18 }}>→</span>
          </Link>
        </Card>
      </div>
    </div>
  );
};
