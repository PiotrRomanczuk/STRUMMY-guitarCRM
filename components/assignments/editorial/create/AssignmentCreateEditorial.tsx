'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { formStyles as s } from '@/components/_editorial/form-styles';
import {
  createAssignmentAction,
  updateAssignmentAction,
  type AssignmentFormValues,
} from '@/app/actions/assignment-edit';
import type { SongOption, StudentOption } from '@/lib/services/lesson-form-data';
import { AssignmentAI } from '@/components/assignments/form/AssignmentAI';
import { ChecklistEditor } from '@/components/assignments/editorial/checklist/ChecklistEditor';
import { ChordDrillEditor } from '@/components/assignments/editorial/chord-drill/ChordDrillEditor';
import { TemplatePicker } from '@/components/assignments/editorial/create/TemplatePicker';
import { sanitizeChecklist, type ChecklistItem } from '@/schemas/AssignmentSchema';
import type { AssignmentTemplateRow } from '@/lib/services/assignment-template-queries';

const toDateInput = (iso: string | null): string => (iso ? iso.slice(0, 10) : '');

type Props = {
  mode: 'create' | 'edit';
  students: StudentOption[];
  songs: SongOption[];
  templates?: AssignmentTemplateRow[];
  initial?: {
    assignmentId: string;
    studentId: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    songId: string | null;
    checklist?: ChecklistItem[];
    chordIds?: string[];
  };
};

// eslint-disable-next-line max-lines-per-function -- single-page editorial form
export const AssignmentCreateEditorial = ({ mode, students, songs, templates, initial }: Props) => {
  const router = useRouter();
  const [studentId, setStudentId] = useState(initial?.studentId ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dueDate, setDueDate] = useState(toDateInput(initial?.dueDate ?? null));
  const [songId, setSongId] = useState(initial?.songId ?? '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initial?.checklist ?? []);
  const [chordIds, setChordIds] = useState<string[]>(initial?.chordIds ?? []);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ student?: string; title?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const applyTemplate = (t: AssignmentTemplateRow) => {
    setTitle(t.title);
    setDescription(t.description ?? '');
    setChecklist(t.checklist);
  };

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (isSaving) return;
      setError('');

      // Validate every field at once, attach errors to the fields themselves,
      // and move focus to the first invalid one.
      const errs: { student?: string; title?: string } = {};
      if (mode === 'create' && !studentId) errs.student = 'Choose a student.';
      if (!title.trim()) errs.title = 'Give the assignment a title.';
      setFieldErrors(errs);
      if (errs.student || errs.title) {
        const firstInvalid = errs.student ? 'assignment-student' : 'assignment-title';
        document.getElementById(firstInvalid)?.focus();
        return;
      }

      const values: AssignmentFormValues = {
        studentId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        songId: songId || null,
        checklist: sanitizeChecklist(checklist),
        chordDrillChordIds: chordIds,
      };

      setIsSaving(true);
      const result =
        mode === 'edit' && initial
          ? await updateAssignmentAction(initial.assignmentId, values)
          : await createAssignmentAction(values);
      setIsSaving(false);

      if ('error' in result) {
        setError(result.error);
        return;
      }
      router.push(`/dashboard/assignments/${result.assignmentId}`);
      router.refresh();
    },
    [
      isSaving,
      title,
      mode,
      studentId,
      description,
      dueDate,
      songId,
      checklist,
      chordIds,
      initial,
      router,
    ]
  );

  return (
    <div style={s.page}>
      <form style={s.shell} onSubmit={handleSubmit}>
        <div style={s.eyebrow}>{mode === 'edit' ? 'Edit assignment' : 'New assignment'}</div>
        <h1 style={s.title}>{mode === 'edit' ? 'Edit assignment' : 'Set an assignment'}</h1>

        {error && <div style={s.error}>{error}</div>}

        {mode === 'create' && templates && (
          <TemplatePicker templates={templates} disabled={isSaving} onApply={applyTemplate} />
        )}

        {mode === 'create' && (
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
              onChange={(e) => {
                setStudentId(e.target.value);
                if (fieldErrors.student) setFieldErrors((f) => ({ ...f, student: undefined }));
              }}
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
        )}

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
            onChange={(e) => {
              setTitle(e.target.value);
              if (fieldErrors.title) setFieldErrors((f) => ({ ...f, title: undefined }));
            }}
          />
          {fieldErrors.title && (
            <div style={{ ...s.error, marginBottom: 0, marginTop: 6, fontSize: 12 }}>
              {fieldErrors.title}
            </div>
          )}
        </div>

        <div style={s.field}>
          <label style={s.label} htmlFor="assignment-due">
            Due date
          </label>
          <input
            id="assignment-due"
            type="date"
            style={s.input}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div style={s.field}>
          <label style={s.label} htmlFor="assignment-song">
            Song (optional)
          </label>
          <select
            id="assignment-song"
            style={s.input}
            value={songId}
            onChange={(e) => setSongId(e.target.value)}
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

        <div style={s.field}>
          <label style={s.label} htmlFor="assignment-notes">
            Brief
          </label>
          <textarea
            id="assignment-notes"
            style={s.textarea}
            value={description}
            placeholder="What should the student do before next lesson…"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <ChecklistEditor items={checklist} onChange={setChecklist} disabled={isSaving} />

        <ChordDrillEditor selected={chordIds} onChange={setChordIds} disabled={isSaving} />

        <div data-testid="assignment-notes-ai">
          <AssignmentAI
            studentName={students.find((stu) => stu.id === studentId)?.name ?? ''}
            studentId={studentId || undefined}
            studentLevel="beginner"
            recentSongs={[songs.find((song) => song.id === songId)?.title].filter(
              (t): t is string => Boolean(t)
            )}
            focusArea={title}
            duration="1 week"
            onAssignmentGenerated={setDescription}
            disabled={isSaving}
          />
        </div>

        <div style={s.actions}>
          <button type="submit" style={s.primary} disabled={isSaving}>
            {isSaving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create assignment'}
          </button>
          <Link
            href={
              initial ? `/dashboard/assignments/${initial.assignmentId}` : '/dashboard/assignments'
            }
            style={s.cancel}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};
