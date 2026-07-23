'use client';

import { FormSection } from '@/components/_editorial/FormSection';

import { inputStyle, StudentField, type StudentSectionProps } from './StudentFields.shared';

type Props = StudentSectionProps & {
  /** Edit context manages the invite email via the dedicated invite flow. */
  showStudentEmail?: boolean;
};

/** Section II — Contact: student email/phone, parent/guardian name + email. */
export const StudentFieldsContact = ({
  values,
  onChange,
  errors,
  showStudentEmail = true,
}: Props) => {
  const populated = [
    showStudentEmail ? values.studentEmail : '',
    values.phone,
    values.parentName,
    values.parentEmail,
  ].filter((v) => v && v.trim()).length;
  const count = showStudentEmail ? 4 : 3;

  return (
    <FormSection
      numeral="II · CONTACT"
      title="Student & parent contact"
      count={count}
      populated={populated}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        {showStudentEmail && (
          <StudentField
            label="Student email"
            hint="Stored now, sent when you're ready"
            error={errors?.studentEmail}
          >
            <input
              type="email"
              value={values.studentEmail}
              onChange={(e) => onChange('studentEmail', e.target.value)}
              placeholder="student@email.com"
              style={inputStyle}
            />
          </StudentField>
        )}
        <StudentField label="Student phone">
          <input
            type="tel"
            value={values.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="(555) 000-0000"
            maxLength={50}
            style={inputStyle}
          />
        </StudentField>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <StudentField label="Parent / guardian name" hint="For students under 18">
          <input
            value={values.parentName}
            onChange={(e) => onChange('parentName', e.target.value)}
            placeholder="e.g. Karen Johnson"
            maxLength={200}
            style={inputStyle}
          />
        </StudentField>
        <StudentField label="Parent email" error={errors?.parentEmail}>
          <input
            type="email"
            value={values.parentEmail}
            onChange={(e) => onChange('parentEmail', e.target.value)}
            placeholder="parent@email.com"
            style={inputStyle}
          />
        </StudentField>
      </div>
    </FormSection>
  );
};
