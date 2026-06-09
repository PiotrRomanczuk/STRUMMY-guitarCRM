// Local re-port of StageStepper from /tmp/strummy-design/.../lesson-primitives.jsx.
// Read-only "sm" variant used by the students-currently-learning list.
import type { SongStatusKey } from '@/components/design-preview/lib/types';

type Stage = { key: SongStatusKey; short: string; label: string };

const STAGES: Stage[] = [
  { key: 'to_learn', short: 'Learn', label: 'To learn' },
  { key: 'started', short: 'Started', label: 'Started' },
  { key: 'remembered', short: 'Remember', label: 'Remembered' },
  { key: 'with_author', short: 'w/ Author', label: 'With author' },
  { key: 'mastered', short: 'Mastered', label: 'Mastered' },
];

const STAGE_COLOR: Record<SongStatusKey, string> = {
  to_learn: 'var(--ink-4)',
  started: 'var(--info)',
  remembered: 'var(--warn)',
  with_author: '#7a6aa0',
  mastered: 'var(--success)',
};

type StageStepperProps = {
  status: SongStatusKey;
  size?: 'sm' | 'md' | 'lg';
};

export const StageStepper = ({ status, size = 'md' }: StageStepperProps) => {
  const idx = STAGES.findIndex((stg) => stg.key === status);
  const color = STAGE_COLOR[status];
  const h = size === 'sm' ? 6 : size === 'lg' ? 10 : 8;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: size === 'lg' ? 8 : 6,
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        {STAGES.map((st, i) => {
          const reached = i <= idx;
          return (
            <div
              key={st.key}
              title={st.label}
              style={{
                flex: 1,
                height: h,
                borderRadius: 2,
                background: reached ? color : 'var(--rule)',
                cursor: 'default',
                transition: 'background .15s',
              }}
            />
          );
        })}
      </div>
      {size !== 'sm' && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: size === 'lg' ? 11 : 10,
            color: 'var(--ink-4)',
            fontFamily: 'var(--mono)',
          }}
        >
          {STAGES.map((st) => (
            <span
              key={st.key}
              style={{
                color: st.key === status ? color : 'var(--ink-4)',
                fontWeight: st.key === status ? 500 : 400,
                cursor: 'default',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              {st.short}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
