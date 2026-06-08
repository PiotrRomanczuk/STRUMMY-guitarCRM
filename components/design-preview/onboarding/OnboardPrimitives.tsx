import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react';

type OnbHeaderProps = {
  eyebrow: string;
  title: string;
  sub?: string;
};

export function OnbHeader({ eyebrow, title, sub }: OnbHeaderProps) {
  return (
    <div style={{ marginBottom: 32 }}>
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
        {eyebrow}
      </div>
      <h1
        style={{
          margin: '0 0 10px',
          fontFamily: 'var(--serif)',
          fontWeight: 400,
          fontSize: 42,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        {title}
      </h1>
      {sub && (
        <p
          style={{
            margin: 0,
            fontSize: 15,
            color: 'var(--ink-3)',
            lineHeight: 1.55,
            maxWidth: 520,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

type OnbFieldProps = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export function OnbField({ label, hint, children }: OnbFieldProps) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <label
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-3)',
            textTransform: 'uppercase',
            letterSpacing: '.12em',
            fontWeight: 500,
          }}
        >
          {label}
        </label>
        {hint && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

type OnbInputProps = InputHTMLAttributes<HTMLInputElement>;

export function OnbInput(props: OnbInputProps) {
  const baseStyle: CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid var(--rule)',
    borderRadius: 8,
    background: 'var(--card)',
    fontFamily: 'var(--sans)',
    fontSize: 15,
    color: 'var(--ink)',
    boxSizing: 'border-box',
  };
  return <input {...props} style={{ ...baseStyle, ...(props.style || {}) }} />;
}

type OnbNextBarProps = {
  back?: string;
  next?: string;
};

export function OnbNextBar({ back = 'Back', next = 'Continue' }: OnbNextBarProps) {
  return (
    <div
      style={{
        marginTop: 'auto',
        paddingTop: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <button
        type="button"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--ink-4)',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        ← {back}
      </button>
      <button
        type="button"
        style={{
          padding: '12px 22px',
          borderRadius: 8,
          border: 'none',
          background: 'var(--ink)',
          color: 'var(--paper)',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        {next} →
      </button>
    </div>
  );
}
