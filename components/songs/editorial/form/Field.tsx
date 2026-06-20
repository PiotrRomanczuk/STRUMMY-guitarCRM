import type { ReactNode } from 'react';

type Props = {
  label: string;
  error?: string;
  optional?: boolean;
  /** Used to link the error message to its field via aria-describedby. */
  fieldId?: string;
  children: ReactNode;
};

export const Field = ({ label, error, optional, fieldId, children }: Props) => (
  <div>
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 6,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--ink-4)',
          textTransform: 'uppercase',
          letterSpacing: '.12em',
        }}
      >
        {label}
      </span>
      {optional && (
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            color: 'var(--ink-5)',
            textTransform: 'uppercase',
            letterSpacing: '.12em',
          }}
        >
          Optional
        </span>
      )}
    </div>
    {children}
    {error && (
      <div
        id={fieldId ? `error-${fieldId}` : undefined}
        style={{
          marginTop: 4,
          fontSize: 11,
          color: 'var(--danger)',
          fontFamily: 'var(--mono)',
        }}
      >
        {error}
      </div>
    )}
  </div>
);
