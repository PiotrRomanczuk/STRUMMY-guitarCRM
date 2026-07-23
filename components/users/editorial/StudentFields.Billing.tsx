'use client';

import { FormSection } from '@/components/_editorial/FormSection';
import {
  BILLING_CYCLE_LABELS,
  BILLING_CYCLES,
  type BillingCycle,
} from '@/schemas/StudentIntakeSchema';

import {
  inputStyle,
  monoInputStyle,
  StudentField,
  type StudentSectionProps,
} from './StudentFields.shared';

/**
 * Section IV — Billing & notes: rate per lesson, billing cycle, goals/notes.
 * BILLING is a new product surface — see the migration header + agent report.
 */
export const StudentFieldsBilling = ({ values, onChange, errors }: StudentSectionProps) => {
  const populated = [values.lessonRate, values.goals].filter((v) => v && v.trim()).length;

  return (
    <FormSection numeral="IV · BILLING" title="Rate & notes" count={2} populated={populated}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <StudentField label="Rate per lesson" error={errors?.lessonRate}>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ink-4)',
                fontSize: 13,
              }}
            >
              $
            </span>
            <input
              inputMode="decimal"
              value={values.lessonRate}
              onChange={(e) => onChange('lessonRate', e.target.value)}
              placeholder="65"
              style={{ ...monoInputStyle, paddingLeft: 22 }}
            />
          </div>
        </StudentField>
        <StudentField label="Billing cycle">
          <select
            value={values.billingCycle}
            onChange={(e) => onChange('billingCycle', e.target.value as BillingCycle)}
            style={inputStyle}
          >
            {BILLING_CYCLES.map((c) => (
              <option key={c} value={c}>
                {BILLING_CYCLE_LABELS[c]}
              </option>
            ))}
          </select>
        </StudentField>
      </div>

      <StudentField label="Goals / notes" hint="What is this student working toward?">
        <textarea
          value={values.goals}
          onChange={(e) => onChange('goals', e.target.value)}
          placeholder="e.g. Wants to play at a friend's wedding by June. Focus on fingerpicking repertoire."
          maxLength={5000}
          style={{ ...inputStyle, minHeight: 90, resize: 'vertical', lineHeight: 1.5 }}
        />
      </StudentField>
    </FormSection>
  );
};
