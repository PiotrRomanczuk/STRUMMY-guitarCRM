'use client';

import { FormSection } from '@/components/_editorial/FormSection';
import { AVATAR_COLORS, INSTRUMENTS, SKILL_LEVELS } from '@/schemas/StudentIntakeSchema';

import {
  inputStyle,
  requiredInputStyle,
  segmentBtnStyle,
  StudentField,
  type StudentSectionProps,
} from './StudentFields.shared';

/** Section I — Identity: full name, instrument, level, start date, avatar colour. */
export const StudentFieldsIdentity = ({ values, onChange, errors }: StudentSectionProps) => {
  const populated = [
    values.fullName,
    values.instrument,
    values.startDate,
    values.avatarColor,
  ].filter((v) => v && v.trim()).length;

  return (
    <FormSection numeral="I · IDENTITY" title="Who they are" count={4} populated={populated}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        <StudentField label="Full name" required error={errors?.fullName}>
          <input
            required
            value={values.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            placeholder="e.g. Emma Johnson"
            maxLength={200}
            style={requiredInputStyle}
          />
        </StudentField>
        <StudentField label="Instrument" hint="Default: Guitar">
          <select
            value={values.instrument}
            onChange={(e) => onChange('instrument', e.target.value)}
            style={inputStyle}
          >
            {INSTRUMENTS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </StudentField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <StudentField label="Level" required error={errors?.skillLevel}>
          <div style={{ display: 'flex', gap: 6 }}>
            {SKILL_LEVELS.map((lvl) => (
              <button
                type="button"
                key={lvl}
                onClick={() => onChange('skillLevel', lvl)}
                aria-pressed={values.skillLevel === lvl}
                style={segmentBtnStyle(values.skillLevel === lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
        </StudentField>
        <StudentField label="Start date">
          <input
            type="date"
            value={values.startDate}
            onChange={(e) => onChange('startDate', e.target.value)}
            style={inputStyle}
          />
        </StudentField>
        <StudentField label="Avatar color">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', height: 38 }}>
            {AVATAR_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                aria-label={`Avatar colour ${c}`}
                aria-pressed={values.avatarColor === c}
                onClick={() => onChange('avatarColor', c)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: c,
                  cursor: 'pointer',
                  border:
                    values.avatarColor === c ? '2px solid var(--ink)' : '2px solid transparent',
                }}
              />
            ))}
          </div>
        </StudentField>
      </div>
    </FormSection>
  );
};
