import { Icon } from '@/components/design-preview/lib/icons';
import { AuthBg, AuthCard } from './AuthFrame';
import { AUTH_EMAIL_ICON, AUTH_SIGNED_IN_EMAIL } from './data';

type Props = {
  width?: number;
  height?: number;
};

export const AuthMagicLinkSent = ({ width = 1280, height = 800 }: Props) => (
  <AuthBg width={width} height={height}>
    <AuthCard>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--gold-tint)',
          display: 'grid',
          placeItems: 'center',
          marginBottom: 18,
          border: '1px solid var(--gold-dim)',
        }}
      >
        <Icon d={AUTH_EMAIL_ICON} size={28} stroke="var(--gold-2)" strokeWidth={1.4} />
      </div>
      <h1
        style={{
          margin: '0 0 8px',
          fontFamily: 'var(--serif)',
          fontWeight: 400,
          fontSize: 30,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}
      >
        Check your inbox.
      </h1>
      <p style={{ margin: '0 0 4px', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.55 }}>
        We sent a magic link to
      </p>
      <p
        style={{
          margin: '0 0 24px',
          fontFamily: 'var(--mono)',
          fontSize: 14,
          color: 'var(--ink)',
          fontWeight: 500,
        }}
      >
        {AUTH_SIGNED_IN_EMAIL}
      </p>

      <div
        style={{
          padding: '14px 16px',
          background: 'var(--paper)',
          border: '1px solid var(--rule)',
          borderRadius: 10,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-4)',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
            marginBottom: 8,
          }}
        >
          What happens next
        </div>
        <ol
          style={{
            margin: 0,
            paddingLeft: 20,
            fontSize: 13,
            color: 'var(--ink-2)',
            lineHeight: 1.65,
          }}
        >
          <li>
            Open the email from <strong style={{ fontWeight: 500 }}>hello@strummy.app</strong>
          </li>
          <li>
            Click{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--gold-2)' }}>“Sign in to Strummy”</em>
          </li>
          <li>You’ll land back here, signed in.</li>
        </ol>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 22,
        }}
      >
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-4)',
            fontSize: 13,
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          ← Use a different email
        </button>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--gold-2)',
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Resend link
        </button>
      </div>

      <div
        style={{
          marginTop: 24,
          padding: '10px 12px',
          background: 'var(--gold-tint)',
          border: '1px solid var(--gold-dim)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--ink-3)',
          lineHeight: 1.5,
        }}
      >
        <strong style={{ color: 'var(--ink-2)', fontWeight: 500 }}>Not seeing it?</strong> Magic
        links can take up to a minute. Check spam, or try Google sign-in.
      </div>
    </AuthCard>
  </AuthBg>
);
