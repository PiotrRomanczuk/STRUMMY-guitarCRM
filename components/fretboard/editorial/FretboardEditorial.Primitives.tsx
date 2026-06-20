import { sectionLabel } from './fretboard.styles';

export const Group = ({
  label,
  aside,
  children,
}: {
  label: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}
    >
      <div style={sectionLabel}>{label}</div>
      {aside}
    </div>
    {children}
  </div>
);

export const Toggle = ({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    type="button"
    data-testid={`fb-toggle-${id}`}
    aria-pressed={value}
    onClick={() => onChange(!value)}
    style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid var(--rule)',
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: 13,
      color: 'var(--ink-2)',
    }}
  >
    <span>{label}</span>
    <span
      style={{
        width: 36,
        height: 20,
        borderRadius: 999,
        background: value ? 'var(--gold)' : 'var(--ink-5)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: value ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
        }}
      />
    </span>
  </button>
);
