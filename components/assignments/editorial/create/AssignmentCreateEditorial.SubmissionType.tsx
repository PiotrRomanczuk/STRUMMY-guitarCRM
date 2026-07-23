'use client';

import { formStyles as s } from '@/components/_editorial/form-styles';
import {
  SubmissionTypeEnum,
  SUBMISSION_TYPE_LABELS,
  type SubmissionType,
} from '@/schemas/AssignmentSchema';

type Props = {
  value: SubmissionType;
  onChange: (value: SubmissionType) => void;
  disabled?: boolean;
};

/** Segmented toggle declaring the expected proof (self-report / audio / video / note). */
export const AssignmentSubmissionTypeToggle = ({ value, onChange, disabled }: Props) => (
  <div style={{ ...s.field, marginBottom: 0 }}>
    <label style={s.label}>How should they submit?</label>
    <div
      role="radiogroup"
      aria-label="Submission type"
      style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
    >
      {SubmissionTypeEnum.options.map((option) => {
        const isSelected = value === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(option)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 12,
              cursor: disabled ? 'default' : 'pointer',
              background: isSelected ? 'var(--ink)' : 'var(--card)',
              color: isSelected ? 'var(--paper)' : 'var(--ink-3)',
              border: '1px solid',
              borderColor: isSelected ? 'var(--ink)' : 'var(--rule)',
              fontFamily: 'var(--sans, inherit)',
            }}
          >
            {SUBMISSION_TYPE_LABELS[option]}
          </button>
        );
      })}
    </div>
  </div>
);
