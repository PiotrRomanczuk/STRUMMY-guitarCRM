type Section = { label: string; populated: number; total: number };

const cardStyle: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--rule)',
  borderRadius: 'var(--radius-lg, 14px)',
  padding: '16px 20px',
  marginTop: 16,
};

/** Per-section field-completion summary, mirroring the mockup's sidebar tracker. */
export const SongFormEditorialCompletionTracker = ({ sections }: { sections: Section[] }) => (
  <div style={cardStyle}>
    <div
      style={{
        color: 'var(--ink-4)',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '.14em',
        fontWeight: 500,
        marginBottom: 12,
      }}
    >
      Completion
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {sections.map((s) => (
        <div
          key={s.label}
          style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}
        >
          <span style={{ color: 'var(--ink-3)' }}>{s.label}</span>
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontWeight: s.populated === s.total ? 600 : 400,
              color: s.populated === s.total ? 'var(--success)' : 'var(--ink-3)',
            }}
          >
            {s.populated}/{s.total}
            {s.populated === s.total ? ' ✓' : ''}
          </span>
        </div>
      ))}
    </div>
  </div>
);
