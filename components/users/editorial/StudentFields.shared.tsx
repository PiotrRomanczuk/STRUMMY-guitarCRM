'use client';

import type { ReactNode } from 'react';

import type { BillingCycle, LessonDay, SkillLevel } from '@/schemas/StudentIntakeSchema';

/** camelCase form model shared by the create + edit student forms. */
export type StudentFormValues = {
  fullName: string;
  instrument: string;
  skillLevel: SkillLevel;
  startDate: string;
  avatarColor: string;
  studentEmail: string;
  phone: string;
  parentName: string;
  parentEmail: string;
  lessonDay: LessonDay;
  lessonTime: string;
  lessonDuration: number;
  /** Kept as string for the controlled input; parsed to a number at submit. */
  lessonRate: string;
  billingCycle: BillingCycle;
  goals: string;
};

export type SetStudentField = <K extends keyof StudentFormValues>(
  key: K,
  value: StudentFormValues[K]
) => void;

export type StudentFieldErrors = Partial<Record<keyof StudentFormValues, string>>;

export type StudentSectionProps = {
  values: StudentFormValues;
  onChange: SetStudentField;
  errors?: StudentFieldErrors;
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: 'var(--paper)',
  fontFamily: 'var(--sans)',
  fontSize: 14,
  color: 'var(--ink)',
  boxSizing: 'border-box',
};

export const monoInputStyle: React.CSSProperties = {
  ...inputStyle,
  fontFamily: 'var(--mono)',
  fontSize: 13,
};

export const requiredInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: 'var(--gold-tint)',
  borderColor: 'var(--gold-dim)',
};

export const segmentBtnStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '9px 8px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  background: active ? 'var(--ink)' : 'var(--card)',
  color: active ? 'var(--paper)' : 'var(--ink-3)',
  fontSize: 12,
  fontWeight: active ? 500 : 400,
  cursor: 'pointer',
  textTransform: 'capitalize',
});

type FieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
};

/** Labelled field wrapper matching the editorial form pattern. */
export const StudentField = ({ label, required, hint, error, children }: FieldProps) => (
  <div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
      <span
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          color: 'var(--ink-4)',
          textTransform: 'uppercase',
          letterSpacing: '.12em',
        }}
      >
        {label}
        {required ? ' *' : ''}
      </span>
      {hint && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{hint}</span>}
    </div>
    {children}
    {error && (
      <div
        style={{ marginTop: 4, fontSize: 11, color: 'var(--danger)', fontFamily: 'var(--mono)' }}
      >
        {error}
      </div>
    )}
  </div>
);
