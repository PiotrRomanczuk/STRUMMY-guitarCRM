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

const toDateInput = (iso: string | null): string => (iso ? iso.slice(0, 10) : '');

type Props = {
  mode: 'create' | 'edit';
  students: StudentOption[];
  songs: SongOption[];
  initial?: {
    assignmentId: string;
    studentId: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    songId: string | null;
  };
};

export const AssignmentCreateEditorial = ({ mode, students, songs, initial }: Props) => {
  const router = useRouter();
  const [studentId, setStudentId] = useState(initial?.studentId ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dueDate, setDueDate] = useState(toDateInput(initial?.dueDate ?? null));
  const [songId, setSongId] = useState(initial?.songId ?? '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (isSaving) return;
      setError('');

      if (!title.trim()) {
        setError('Give the assignment a title.');
        return;
      }
      if (mode === 'create' && !studentId) {
        setError('Choose the student this assignment is for.');
        return;
      }

      const values: AssignmentFormValues = {
        studentId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        songId: songId || null,
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
    [isSaving, title, mode, studentId, description, dueDate, songId, initial, router]
  );

  return (
    <div style={s.page}>
      <form style={s.shell} onSubmit={handleSubmit}>
        <div style={s.eyebrow}>{mode === 'edit' ? 'Edit assignment' : 'New assignment'}</div>
        <h1 style={s.title}>{mode === 'edit' ? 'Edit assignment' : 'Set an assignment'}</h1>

        {error && <div style={s.error}>{error}</div>}

        {mode === 'create' && (
          <div style={s.field}>
            <label style={s.label} htmlFor="assignment-student">
              Student
            </label>
            <select
              id="assignment-student"
              style={s.input}
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">Select a student…</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name ?? st.email ?? 'Unnamed'} {st.email ? `· ${st.email}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={s.field}>
          <label style={s.label} htmlFor="assignment-title">
            Title
          </label>
          <input
            id="assignment-title"
            style={s.input}
            value={title}
            placeholder="e.g. Practise the C–Am–F–G loop"
            onChange={(e) => setTitle(e.target.value)}
          />
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
