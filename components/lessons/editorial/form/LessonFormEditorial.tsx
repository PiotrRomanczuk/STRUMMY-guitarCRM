'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { formStyles as s } from '@/components/_editorial/form-styles';
import { createLessonAction, updateLessonAction } from '@/app/actions/lesson-edit';
import type { LessonFormValues } from '@/app/actions/lesson-edit';
import type { SongOption, StudentOption } from '@/lib/services/lesson-form-data';
import { LessonFormFields } from './LessonForm.Fields';

const NEW_STUDENT = '__new__';

type Props = {
  mode: 'create' | 'edit';
  students: StudentOption[];
  songs: SongOption[];
  initial?: {
    lessonId: string;
    studentId: string;
    title: string | null;
    notes: string | null;
    scheduledAt: string;
    status: string;
    songIds: string[];
  };
};

const toLocalInput = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const LessonFormEditorial = ({ mode, students, songs, initial }: Props) => {
  const router = useRouter();
  const [studentId, setStudentId] = useState(initial?.studentId ?? '');
  const [studentEmail, setStudentEmail] = useState('');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [scheduledLocal, setScheduledLocal] = useState(
    initial ? toLocalInput(initial.scheduledAt) : ''
  );
  const [status, setStatus] = useState(initial?.status ?? 'SCHEDULED');
  const [songIds, setSongIds] = useState<string[]>(initial?.songIds ?? []);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isNewStudent = studentId === NEW_STUDENT;

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (isSaving) return;
      setError('');

      if (!scheduledLocal) {
        setError('Pick a date and time for the lesson.');
        return;
      }
      const values: LessonFormValues = {
        studentId: isNewStudent || !studentId ? undefined : studentId,
        studentEmail: isNewStudent ? studentEmail : undefined,
        title: title.trim() || undefined,
        notes: notes.trim() || undefined,
        scheduledAt: new Date(scheduledLocal).toISOString(),
        status: status as LessonFormValues['status'],
        songIds,
      };

      if (mode === 'create' && !values.studentId && !values.studentEmail) {
        setError('Choose a student or add one by email.');
        return;
      }

      setIsSaving(true);
      const result =
        mode === 'edit' && initial
          ? await updateLessonAction(initial.lessonId, values)
          : await createLessonAction(values);
      setIsSaving(false);

      if ('error' in result) {
        setError(result.error);
        return;
      }
      router.push(`/dashboard/lessons/${result.lessonId}`);
      router.refresh();
    },
    [
      isSaving,
      scheduledLocal,
      isNewStudent,
      studentId,
      studentEmail,
      title,
      notes,
      status,
      songIds,
      mode,
      initial,
      router,
    ]
  );

  return (
    <div style={s.page}>
      <form style={s.shell} onSubmit={handleSubmit}>
        <div style={s.eyebrow}>{mode === 'edit' ? 'Edit lesson' : 'New lesson'}</div>
        <h1 style={s.title}>{mode === 'edit' ? 'Edit lesson' : 'Schedule a lesson'}</h1>

        {error && <div style={s.error}>{error}</div>}

        <LessonFormFields
          mode={mode}
          students={students}
          songs={songs}
          newStudentValue={NEW_STUDENT}
          studentId={studentId}
          studentEmail={studentEmail}
          title={title}
          notes={notes}
          scheduledLocal={scheduledLocal}
          status={status}
          songIds={songIds}
          onStudentId={setStudentId}
          onStudentEmail={setStudentEmail}
          onTitle={setTitle}
          onNotes={setNotes}
          onScheduled={setScheduledLocal}
          onStatus={setStatus}
          onSongIds={setSongIds}
        />

        <div style={s.actions}>
          <button type="submit" style={s.primary} disabled={isSaving}>
            {isSaving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create lesson'}
          </button>
          <Link
            href={initial ? `/dashboard/lessons/${initial.lessonId}` : '/dashboard/lessons'}
            style={s.cancel}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};
