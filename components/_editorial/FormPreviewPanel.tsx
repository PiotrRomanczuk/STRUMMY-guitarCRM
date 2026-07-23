import type { ReactNode } from 'react';

const wrapStyle: React.CSSProperties = { position: 'sticky', top: 0, alignSelf: 'flex-start' };

const cardStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--rule)',
  borderRadius: 'var(--radius-lg, 14px)',
  padding: 20,
};

const labelStyle: React.CSSProperties = {
  color: 'var(--ink-4)',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '.14em',
  fontWeight: 500,
  marginBottom: 14,
};

/** Sticky "live preview" sidebar for editorial two-column forms. Purely
 * presentational — callers supply whatever summary content fits their form. */
export const FormPreviewPanel = ({ children }: { children: ReactNode }) => (
  <div style={wrapStyle}>
    <div style={cardStyle}>
      <div style={labelStyle}>Preview</div>
      {children}
    </div>
  </div>
);
