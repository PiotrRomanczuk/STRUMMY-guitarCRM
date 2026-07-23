'use client';

import { formStyles as s } from '@/components/_editorial/form-styles';
import { FormSection } from '@/components/_editorial/FormSection';
import type { SongOption, StudentOption } from '@/lib/services/lesson-form-data';
import { DAILY_TARGET_OPTIONS } from '@/schemas/AssignmentSchema';

type Props = {
  mode: 'create' | 'edit';
  students: StudentOption[];
  songs: SongOption[];
  studentId: string;
  title: string;
  dueDate: string;
  songId: string;
  description: string;
  dailyTargetMinutes: number | null;
  fieldErrors: { student?: string; title?: string };
  onStudentId: (v: string) => void;
  onTitle: (v: string) => void;
  onDueDate: (v: string) => void;
  onSongId: (v: string) => void;
  onDescription: (v: string) => void;
  onDailyTargetMinutes: (v: number | null) => void;
};

/** Sections I (who) + II (what/when) of the dedicated assignment form. */
export const AssignmentCreateEditorialFields = ({
  mode,
  students,
  songs,
  studentId,
  title,
  dueDate,
  songId,
  description,
  dailyTargetMinutes,
  fieldErrors,
  onStudentId,
  onTitle,
  onDueDate,
  onSongId,
  onDescription,
  onDailyTargetMinutes,
}: Props) => (
  <>
    {mode === 'create' && (
      <FormSection numeral="I · WHO" title="Student" count={1} populated={studentId ? 1 : 0}>
        <div style={s.field}>
          <label style={s.label} htmlFor="assignment-student">
            Student
          </label>
          <select
            id="assignment-student"
            style={{
              ...s.input,
              ...(fieldErrors.student ? { borderColor: 'var(--danger)' } : {}),
            }}
            value={studentId}
            aria-invalid={Boolean(fieldErrors.student)}
            onChange={(e) => onStudentId(e.target.value)}
          >
            <option value="">Select a student…</option>
            {students.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name ?? st.email ?? 'Unnamed'} {st.email ? `· ${st.email}` : ''}
              </option>
            ))}
          </select>
          {fieldErrors.student && (
            <div style={{ ...s.error, marginBottom: 0, marginTop: 6, fontSize: 12 }}>
              {fieldErrors.student}
            </div>
          )}
        </div>
      </FormSection>
    )}

    <FormSection
      numeral="II · WHAT & WHEN"
      title="Song, brief & due date"
      count={2}
      populated={[title, dueDate].filter(Boolean).length}
    >
      <div style={s.field}>
        <label style={s.label} htmlFor="assignment-title">
          Title
        </label>
        <input
          id="assignment-title"
          style={{ ...s.input, ...(fieldErrors.title ? { borderColor: 'var(--danger)' } : {}) }}
          value={title}
          placeholder="e.g. Practise the C–Am–F–G loop"
          aria-invalid={Boolean(fieldErrors.title)}
          onChange={(e) => onTitle(e.target.value)}
        />
        {fieldErrors.title && (
          <div style={{ ...s.error, marginBottom: 0, marginTop: 6, fontSize: 12 }}>
            {fieldErrors.title}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={s.field}>
          <label style={s.label} htmlFor="assignment-due">
            Due date
          </label>
          <input
            id="assignment-due"
            type="date"
            style={s.input}
            value={dueDate}
            onChange={(e) => onDueDate(e.target.value)}
          />
        </div>

        <div style={s.field}>
          <label style={s.label} htmlFor="assignment-daily-target">
            Daily target
          </label>
          <select
            id="assignment-daily-target"
            style={s.input}
            value={dailyTargetMinutes ?? ''}
            onChange={(e) => onDailyTargetMinutes(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">No target</option>
            {DAILY_TARGET_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} min/day
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={s.field}>
        <label style={s.label} htmlFor="assignment-song">
          Song (optional)
        </label>
        <select
          id="assignment-song"
          style={s.input}
          value={songId}
          onChange={(e) => onSongId(e.target.value)}
        >
          <option value="">No song</option>
          {songs.map((song) => (
            <option key={song.id} value={song.id}>
              {song.title}
              {song.author ? ` — ${song.author}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div style={{ ...s.field, marginBottom: 0 }}>
        <label style={s.label} htmlFor="assignment-notes">
          Brief
        </label>
        <textarea
          id="assignment-notes"
          style={s.textarea}
          value={description}
          placeholder="What should the student do before next lesson…"
          onChange={(e) => onDescription(e.target.value)}
        />
      </div>
    </FormSection>
  </>
);
