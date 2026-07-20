type Props = {
  done: number;
  total: number;
  /** compact = list row (thin bar + count only); full = detail card. */
  compact?: boolean;
};

/** Derived progress bar for a checklist. Renders nothing when there are no items. */
export const ChecklistProgress = ({ done, total, compact }: Props) => {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);
  const complete = done === total;
  const barColour = complete ? 'var(--success)' : 'var(--gold-2)';

  if (compact) {
    return (
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        title={`${done}/${total} done`}
      >
        <div
          style={{
            width: 44,
            height: 4,
            borderRadius: 999,
            background: 'rgba(0,0,0,.08)',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: `${pct}%`, height: '100%', background: barColour }} />
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)' }}>
          {done}/{total}
        </span>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--mono)',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '.1em',
          color: 'var(--ink-4)',
          marginBottom: 6,
        }}
      >
        <span>Progress</span>
        <span style={{ color: complete ? 'var(--success)' : 'var(--ink-3)' }}>
          {done} / {total} done · {pct}%
        </span>
      </div>
      <div
        style={{ height: 6, borderRadius: 999, background: 'rgba(0,0,0,.08)', overflow: 'hidden' }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: barColour,
            transition: 'width .2s',
          }}
        />
      </div>
    </div>
  );
};
