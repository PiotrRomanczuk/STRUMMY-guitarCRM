'use client';

import { formStyles as s } from '@/components/_editorial/form-styles';
import type { SongOption, StudentOption } from '@/lib/services/lesson-form-data';

const LESSON_STATUSES = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

type Props = {
  mode: 'create' | 'edit';
  students: StudentOption[];
  songs: SongOption[];
  newStudentValue: string;
  studentId: string;
  studentEmail: string;
  title: string;
  notes: string;
  scheduledLocal: string;
  status: string;
  songIds: string[];
  onStudentId: (v: string) => void;
  onStudentEmail: (v: string) => void;
  onTitle: (v: string) => void;
  onNotes: (v: string) => void;
  onScheduled: (v: string) => void;
  onStatus: (v: string) => void;
  onSongIds: (v: string[]) => void;
};

export const LessonFormFields = ({
  mode,
  students,
  songs,
  newStudentValue,
  studentId,
  studentEmail,
  title,
  notes,
  scheduledLocal,
  status,
  songIds,
  onStudentId,
  onStudentEmail,
  onTitle,
  onNotes,
  onScheduled,
  onStatus,
  onSongIds,
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

      <div style={s.field}>
        <label style={s.label} htmlFor="lesson-songs">
          Repertoire
        </label>
        <select
          id="lesson-songs"
          multiple
          style={{ ...s.input, minHeight: 120 }}
          value={songIds}
          onChange={(e) => onSongIds(Array.from(e.target.selectedOptions, (o) => o.value))}
        >
          {songs.map((song) => (
            <option key={song.id} value={song.id}>
              {song.title}
              {song.author ? ` — ${song.author}` : ''}
            </option>
          ))}
        </select>
        <span style={s.hint}>Hold ⌘/Ctrl to select multiple songs.</span>
      </div>

      <div style={s.field}>
        <label style={s.label} htmlFor="lesson-notes">
          Notes
        </label>
        <textarea
          id="lesson-notes"
          style={s.textarea}
          value={notes}
          placeholder="What did you cover, what to practise…"
          onChange={(e) => onNotes(e.target.value)}
        />
      </div>
    </>
  );
};
