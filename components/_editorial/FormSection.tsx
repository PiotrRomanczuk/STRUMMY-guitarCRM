import type { ReactNode } from 'react';

type Props = {
  numeral: string;
  title: string;
  count?: number;
  populated?: number;
  children: ReactNode;
};

const sectionStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--rule)',
  borderRadius: 'var(--radius-lg, 14px)',
  padding: '18px 20px',
  marginBottom: 16,
};

const headerRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 14,
};

const numeralStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 10,
  color: 'var(--ink-4)',
  textTransform: 'uppercase',
  letterSpacing: '.12em',
};

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--serif)',
  fontSize: 17,
  fontWeight: 500,
  marginTop: 4,
};

const countStyle: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 11,
  color: 'var(--ink-4)',
  background: 'var(--gold-tint)',
  borderRadius: 999,
  padding: '3px 9px',
  flexShrink: 0,
};

/** Numbered, boxed section for editorial two-column forms (matches the
 * "I · WHO & WHEN" / "II · FORMAT" mockup pattern). Purely presentational. */
export const FormSection = ({ numeral, title, count, populated, children }: Props) => (
  <div style={sectionStyle}>
    <div style={headerRowStyle}>
      <div>
        <div style={numeralStyle}>{numeral}</div>
        <div style={titleStyle}>{title}</div>
      </div>
      {count !== undefined && (
        <span style={countStyle}>
          {populated ?? 0}/{count}
        </span>
      )}
    </div>
    {children}
  </div>
);
