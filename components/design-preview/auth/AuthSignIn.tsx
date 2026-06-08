import { Icon } from '@/components/design-preview/lib/icons';
import { AuthBg, AuthCard, authBtnSecondary, authInput, authLabel } from './AuthFrame';
import { AUTH_EMAIL_ICON, AUTH_SIGNED_IN_EMAIL } from './data';

type Props = {
  width?: number;
  height?: number;
};

export const AuthSignIn = ({ width = 1280, height = 800 }: Props) => (
  <AuthBg width={width} height={height}>
    <AuthCard>
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--ink-4)',
          textTransform: 'uppercase',
          letterSpacing: '.14em',
          marginBottom: 6,
        }}
      >
        Welcome back
      </div>
      <h1
        style={{
          margin: '0 0 8px',
          fontFamily: 'var(--serif)',
          fontWeight: 400,
          fontSize: 34,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        Sign <em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>in</em>.
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--ink-4)', lineHeight: 1.55 }}>
        Pop in your email — we’ll send a one-click magic link. No passwords.
      </p>

      <label style={authLabel}>Email</label>
      <input defaultValue={AUTH_SIGNED_IN_EMAIL} style={authInput} />

      <button
        style={{
          marginTop: 18,
          width: '100%',
          padding: '13px 16px',
          borderRadius: 8,
          border: 'none',
          background: 'var(--ink)',
          color: 'var(--paper)',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Icon d={AUTH_EMAIL_ICON} size={14} stroke="var(--paper)" /> Send magic link
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 16px' }}>
        <span style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textTransform: 'uppercase',
            letterSpacing: '.12em',
          }}
        >
          or
        </span>
        <span style={{ flex: 1, height: 1, background: 'var(--rule)' }} />
      </div>

      <button style={authBtnSecondary}>
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            display: 'inline-grid',
            placeItems: 'center',
            fontFamily: 'var(--serif)',
            fontWeight: 700,
            fontSize: 12,
            color: '#4285F4',
            border: '1px solid var(--rule)',
          }}
        >
          G
        </span>
        Continue with Google
      </button>
      <button style={{ ...authBtnSecondary, marginTop: 8 }}>
        <span style={{ width: 18, height: 18 }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M17 1.5c-1.4.1-3.1 1-4 2-.9 1-1.7 2.5-1.5 4 1.5.1 3.1-.8 4-1.8.9-1 1.6-2.5 1.5-4.2zm5 16c-.7 1.6-1.1 2.3-2 3.7-1.3 2-3.1 4.4-5.4 4.4-2 0-2.6-1.3-5.4-1.3s-3.4 1.3-5.4 1.3c-2.3 0-4-2.3-5.3-4.2-3.6-5.4-4-11.8-1.8-15.2 1.6-2.4 4.1-3.8 6.5-3.8 2.4 0 4 1.3 6 1.3 2 0 3.2-1.3 6-1.3 2.1 0 4.4 1.2 6 3.2-5.3 2.9-4.4 10.4 1.8 11.9z" />
          </svg>
        </span>
        Continue with Apple
      </button>

      <div
        style={{
          marginTop: 24,
          paddingTop: 18,
          borderTop: '1px solid var(--rule)',
          fontSize: 12,
          color: 'var(--ink-4)',
          textAlign: 'center',
        }}
      >
        New to Strummy?{' '}
        <span style={{ color: 'var(--gold-2)', fontWeight: 500, cursor: 'pointer' }}>
          Start your studio →
        </span>
      </div>
    </AuthCard>
  </AuthBg>
);
