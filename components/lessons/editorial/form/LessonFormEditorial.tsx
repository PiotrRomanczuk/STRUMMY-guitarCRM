'use client';

import Link from 'next/link';
import { useState } from 'react';

import { formStyles as s } from '@/components/_editorial/form-styles';
import { WEEK_OPTIONS } from '@/schemas/RecurringLessonSchema';
import type { SongOption, StudentOption } from '@/lib/services/lesson-form-data';
import { LessonFormFields } from './LessonForm.Fields';
import { LessonFormRecurring } from './LessonForm.Recurring';
import { LessonNotesAI } from '@/components/lessons/form/LessonNotesAI';
import { useLessonFormSubmit } from './useLessonFormSubmit';

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
  const [studentId, setStudentId] = useState(initial?.studentId ?? '');
  const [studentEmail, setStudentEmail] = useState('');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [scheduledLocal, setScheduledLocal] = useState(
    initial ? toLocalInput(initial.scheduledAt) : ''
  );
  const [status, setStatus] = useState(initial?.status ?? 'SCHEDULED');
  const [songIds, setSongIds] = useState<string[]>(initial?.songIds ?? []);
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState<number>(WEEK_OPTIONS[0].value);

  const isNewStudent = studentId === NEW_STUDENT;

  const selectedStudent = students.find((stu) => stu.id === studentId);
  const aiStudentName = isNewStudent ? studentEmail : (selectedStudent?.name ?? '');
  const aiSongsCovered = songIds
    .map((id) => songs.find((song) => song.id === id)?.title)
    .filter((t): t is string => Boolean(t));

  const { error, isSaving, handleSubmit } = useLessonFormSubmit({
    mode,
    initialLessonId: initial?.lessonId,
    isNewStudent,
    studentId,
    studentEmail,
    title,
    notes,
    scheduledLocal,
    status,
    songIds,
    repeatWeekly,
    repeatWeeks,
  });

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

        {mode === 'create' && (
          <LessonFormRecurring
            repeatWeekly={repeatWeekly}
            weeks={repeatWeeks}
            disabled={isSaving}
            onRepeatWeekly={setRepeatWeekly}
            onWeeks={setRepeatWeeks}
          />
        )}

        <div data-testid="lesson-notes-ai">
          <LessonNotesAI
            studentName={aiStudentName}
            studentId={isNewStudent ? undefined : studentId || undefined}
            songsCovered={aiSongsCovered}
            lessonTopic={title}
            onNotesGenerated={setNotes}
            disabled={isSaving}
          />
        </div>

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
