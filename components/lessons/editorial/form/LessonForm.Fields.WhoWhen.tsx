'use client';

import { formStyles as s } from '@/components/_editorial/form-styles';
import type { StudentOption } from '@/lib/services/lesson-form-data';
import type { LessonFormat } from '@/schemas/LessonSchema';
import { LessonFormFormatToggle } from './LessonForm.Fields.Format';

const LESSON_STATUSES = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const DURATION_OPTIONS = [30, 45, 60];

type Props = {
  mode: 'create' | 'edit';
  students: StudentOption[];
  newStudentValue: string;
  studentId: string;
  studentEmail: string;
  title: string;
  scheduledLocal: string;
  status: string;
  durationMinutes: number;
  format: LessonFormat;
  onStudentId: (v: string) => void;
  onStudentEmail: (v: string) => void;
  onTitle: (v: string) => void;
  onScheduled: (v: string) => void;
  onStatus: (v: string) => void;
  onDurationMinutes: (v: number) => void;
  onFormat: (v: LessonFormat) => void;
};

/** Section I — "who and when": student, title, scheduled time, status. */
export const LessonFormFieldsWhoWhen = ({
  mode,
  students,
  newStudentValue,
  studentId,
  studentEmail,
  title,
  scheduledLocal,
  status,
  durationMinutes,
  format,
  onStudentId,
  onStudentEmail,
  onTitle,
  onScheduled,
  onStatus,
  onDurationMinutes,
  onFormat,
}: Props) => {
  const isNewStudent = studentId === newStudentValue;

  return (
    <>
      {mode === 'create' && (
        <div style={s.field}>
          <label style={s.label} htmlFor="lesson-student">
            Student
          </label>
          <select
            id="lesson-student"
            style={s.input}
            value={studentId}
            onChange={(e) => onStudentId(e.target.value)}
          >
            <option value="">Select a student…</option>
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name ?? st.email ?? 'Unnamed'} {st.email ? `· ${st.email}` : ''}
              </option>
            ))}
            <option value={newStudentValue}>+ New student by email…</option>
          </select>
          {isNewStudent && (
            <>
              <input
                type="email"
                style={{ ...s.input, marginTop: 6 }}
                placeholder="student@email.com"
                value={studentEmail}
                onChange={(e) => onStudentEmail(e.target.value)}
              />
              <span style={s.hint}>
                No account yet? We&apos;ll create a placeholder student you can invite later.
              </span>
            </>
          )}
        </div>
      )}

      <div style={s.field}>
        <label style={s.label} htmlFor="lesson-title">
          Title
        </label>
        <input
          id="lesson-title"
          style={s.input}
          value={title}
          placeholder="e.g. Fingerpicking warm-ups"
          onChange={(e) => onTitle(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={s.field}>
          <label style={s.label} htmlFor="lesson-when">
            Scheduled
          </label>
          <input
            id="lesson-when"
            type="datetime-local"
            style={s.input}
            value={scheduledLocal}
            onChange={(e) => onScheduled(e.target.value)}
            required
          />
        </div>

        <div style={s.field}>
          <label style={s.label} htmlFor="lesson-status">
            Status
          </label>
          <select
            id="lesson-status"
            style={s.input}
            value={status}
            onChange={(e) => onStatus(e.target.value)}
          >
            {LESSON_STATUSES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={s.field}>
          <label style={s.label} htmlFor="lesson-duration">
            Duration
          </label>
          <select
            id="lesson-duration"
            style={s.input}
            value={durationMinutes}
            onChange={(e) => onDurationMinutes(Number(e.target.value))}
          >
            {DURATION_OPTIONS.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} min
              </option>
            ))}
          </select>
        </div>

        <LessonFormFormatToggle value={format} onChange={onFormat} />
      </div>
    </>
  );
};
