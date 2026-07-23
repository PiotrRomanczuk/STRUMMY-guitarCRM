'use client';

import { FormSection } from '@/components/_editorial/FormSection';
import { LESSON_DAYS, LESSON_DURATIONS, type LessonDay } from '@/schemas/StudentIntakeSchema';

import {
  inputStyle,
  monoInputStyle,
  StudentField,
  type StudentSectionProps,
} from './StudentFields.shared';

/** Section III — Schedule: recurring lesson day, time, duration. */
export const StudentFieldsSchedule = ({ values, onChange }: StudentSectionProps) => {
  const populated = [values.lessonDay, values.lessonTime, String(values.lessonDuration)].filter(
    (v) => v && v.trim()
  ).length;

  return (
    <FormSection numeral="III · SCHEDULE" title="Recurring lesson" count={3} populated={populated}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <StudentField label="Day">
          <select
            value={values.lessonDay}
            onChange={(e) => onChange('lessonDay', e.target.value as LessonDay)}
            style={inputStyle}
          >
            {LESSON_DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </StudentField>
        <StudentField label="Time">
          <input
            value={values.lessonTime}
            onChange={(e) => onChange('lessonTime', e.target.value)}
            placeholder="4:00 PM"
            maxLength={40}
            style={monoInputStyle}
          />
        </StudentField>
        <StudentField label="Duration">
          <select
            value={values.lessonDuration}
            onChange={(e) => onChange('lessonDuration', Number(e.target.value))}
            style={inputStyle}
          >
            {LESSON_DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} min
              </option>
            ))}
          </select>
        </StudentField>
      </div>
    </FormSection>
  );
};
