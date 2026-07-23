'use client';

import { formStyles as s } from '@/components/_editorial/form-styles';
import type { LessonFormat } from '@/schemas/LessonSchema';

const FORMAT_OPTIONS: { value: LessonFormat; label: string }[] = [
  { value: 'in_person', label: 'In-person' },
  { value: 'video', label: 'Video call' },
];

type Props = {
  value: LessonFormat;
  onChange: (v: LessonFormat) => void;
};

/** In-person / Video call segmented toggle (mockup Section II · FORMAT). */
export const LessonFormFormatToggle = ({ value, onChange }: Props) => (
  <div style={s.field}>
    <span style={s.label} id="lesson-format-label">
      Format
    </span>
    <div role="group" aria-labelledby="lesson-format-label" style={{ display: 'flex', gap: 6 }}>
      {FORMAT_OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '10px 8px',
              borderRadius: 8,
              fontSize: 12,
              cursor: 'pointer',
              border: '1px solid var(--rule)',
              background: isActive ? 'var(--ink)' : 'var(--card)',
              color: isActive ? 'var(--paper)' : 'var(--ink-3)',
              fontFamily: 'var(--sans, inherit)',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);
