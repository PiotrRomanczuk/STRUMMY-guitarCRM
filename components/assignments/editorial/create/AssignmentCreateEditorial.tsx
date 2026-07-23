'use client';

import Link from 'next/link';
import { useState } from 'react';

import { formStyles as s } from '@/components/_editorial/form-styles';
import { FormSection } from '@/components/_editorial/FormSection';
import { FormPreviewPanel } from '@/components/_editorial/FormPreviewPanel';
import type { SongOption, StudentOption } from '@/lib/services/lesson-form-data';
import { AssignmentAI } from '@/components/assignments/form/AssignmentAI';
import { ChecklistEditor } from '@/components/assignments/editorial/checklist/ChecklistEditor';
import { ChordDrillEditor } from '@/components/assignments/editorial/chord-drill/ChordDrillEditor';
import { TemplatePicker } from '@/components/assignments/editorial/create/TemplatePicker';
import { AssignmentCreateEditorialFields } from './AssignmentCreateEditorial.Fields';
import { AssignmentCreateEditorialPreview } from './AssignmentCreateEditorial.Preview';
import { useAssignmentFormSubmit } from './useAssignmentFormSubmit';
import type { ChecklistItem } from '@/schemas/AssignmentSchema';
import type { AssignmentTemplateRow } from '@/lib/services/assignment-template-queries';
import { SHOW_AI_FEATURES } from '@/lib/config/features';

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

export const AssignmentCreateEditorial = ({ mode, students, songs, templates, initial }: Props) => {
  const [studentId, setStudentId] = useState(initial?.studentId ?? '');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [dueDate, setDueDate] = useState(toDateInput(initial?.dueDate ?? null));
  const [songId, setSongId] = useState(initial?.songId ?? '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initial?.checklist ?? []);
  const [chordIds, setChordIds] = useState<string[]>(initial?.chordIds ?? []);

  const applyTemplate = (t: AssignmentTemplateRow) => {
    setTitle(t.title);
    setDescription(t.description ?? '');
    setChecklist(t.checklist);
  };

  const { error, fieldErrors, isSaving, handleSubmit, clearFieldError } = useAssignmentFormSubmit({
    mode,
    initialAssignmentId: initial?.assignmentId,
    studentId,
    title,
    description,
    dueDate,
    songId,
    checklist,
    chordIds,
  });

  const selectedStudent = students.find((stu) => stu.id === studentId);
  const selectedSong = songs.find((song) => song.id === songId);

  return (
    <div style={s.page}>
      <form style={{ maxWidth: 1040, margin: '0 auto' }} onSubmit={handleSubmit}>
        <div style={s.eyebrow}>{mode === 'edit' ? 'Edit assignment' : 'New assignment'}</div>
        <h1 style={s.title}>{mode === 'edit' ? 'Edit assignment' : 'Set an assignment'}</h1>

        {error && <div style={s.error}>{error}</div>}

        {mode === 'create' && templates && (
          <TemplatePicker templates={templates} disabled={isSaving} onApply={applyTemplate} />
        )}

        <div className="ed-grid-form">
          <div>
            <AssignmentCreateEditorialFields
              mode={mode}
              students={students}
              songs={songs}
              studentId={studentId}
              title={title}
              dueDate={dueDate}
              songId={songId}
              description={description}
              fieldErrors={fieldErrors}
              onStudentId={(v) => {
                setStudentId(v);
                if (fieldErrors.student) clearFieldError('student');
              }}
              onTitle={(v) => {
                setTitle(v);
                if (fieldErrors.title) clearFieldError('title');
              }}
              onDueDate={setDueDate}
              onSongId={setSongId}
              onDescription={setDescription}
            />

            <FormSection
              numeral="III · PROOF"
              title="Checklist & chord drill"
              count={2}
              populated={[checklist.length > 0, chordIds.length > 0].filter(Boolean).length}
            >
              <ChecklistEditor items={checklist} onChange={setChecklist} disabled={isSaving} />
              <ChordDrillEditor selected={chordIds} onChange={setChordIds} disabled={isSaving} />
            </FormSection>

            {SHOW_AI_FEATURES && (
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
            )}

            <div style={s.actions}>
              <button type="submit" style={s.primary} disabled={isSaving}>
                {isSaving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create assignment'}
              </button>
              <Link
                href={
                  initial
                    ? `/dashboard/assignments/${initial.assignmentId}`
                    : '/dashboard/assignments'
                }
                style={s.cancel}
              >
                Cancel
              </Link>
            </div>
          </div>

          <FormPreviewPanel>
            <AssignmentCreateEditorialPreview
              student={selectedStudent}
              song={selectedSong}
              dueDate={dueDate}
            />
          </FormPreviewPanel>
        </div>
      </form>
    </div>
  );
};
