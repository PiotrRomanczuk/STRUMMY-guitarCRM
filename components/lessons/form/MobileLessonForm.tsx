'use client';

import StepWizardForm from '@/components/shared/StepWizardForm';
import { FormFieldText, FormFieldSelect } from '@/components/shared/FormField';
import { SongSelect } from './LessonForm.SongSelect';
import { LessonNotesAI } from './LessonNotesAI';
import { LessonFormData } from '../hooks/useLessonForm';

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

interface MobileLessonFormProps {
  formData: LessonFormData;
  errors: Record<string, string>;
  students: Profile[];
  teachers: Profile[];
  selectedSongs: Array<{ title: string }>;
  onFieldChange: (name: string, value: string) => void;
  onBlur: (field: string) => void;
  onSongChange: (songIds: string[]) => void;
}

const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function MobileLessonForm({
  formData,
  errors,
  students,
  teachers,
  selectedSongs,
  onFieldChange,
  onBlur,
  onSongChange,
}: MobileLessonFormProps) {
  const studentOptions = students.map((s) => ({
    value: s.id,
    label: s.full_name || s.email,
    description: s.full_name ? s.email : undefined,
  }));

  const teacherOptions = teachers.map((t) => ({
    value: t.id,
    label: t.full_name || t.email,
    description: t.full_name ? t.email : undefined,
  }));

  const studentName = students.find((s) => s.id === formData.student_id)?.full_name || '';

  const steps = [
    {
      label: 'Student & Schedule',
      requiredFields: ['student_id', 'teacher_id', 'scheduled_at'],
      content: (
        <div className="space-y-4">
          <FormFieldSelect
            label="Student"
            id="student_id"
            value={formData.student_id}
            error={errors.student_id}
            onChange={(v) => onFieldChange('student_id', v)}
            onBlur={() => onBlur('student_id')}
            options={studentOptions}
            required
          />

          <FormFieldSelect
            label="Teacher"
            id="teacher_id"
            value={formData.teacher_id}
            error={errors.teacher_id}
            onChange={(v) => onFieldChange('teacher_id', v)}
            onBlur={() => onBlur('teacher_id')}
            options={teacherOptions}
            required
          />

          <FormFieldText
            label="Scheduled Date & Time"
            id="scheduled_at"
            type="datetime-local"
            value={formData.scheduled_at}
            error={errors.scheduled_at}
            onChange={(v) => onFieldChange('scheduled_at', v)}
            onBlur={() => onBlur('scheduled_at')}
            required
          />

          <FormFieldSelect
            label="Status"
            id="status"
            value={formData.status || 'SCHEDULED'}
            error={errors.status}
            onChange={(v) => onFieldChange('status', v)}
            options={STATUS_OPTIONS}
          />
        </div>
      ),
    },
    {
      label: 'Songs',
      content: (
        <div className="space-y-4">
          <SongSelect
            selectedSongIds={formData.song_ids || []}
            onChange={onSongChange}
            error={errors.song_ids}
            studentId={formData.student_id}
          />
        </div>
      ),
    },
    {
      label: 'Notes',
      content: (
        <div className="space-y-4">
          <FormFieldText
            label="Lesson Title (Optional)"
            id="title"
            value={formData.title || ''}
            error={errors.title}
            onChange={(v) => onFieldChange('title', v)}
            onBlur={() => onBlur('title')}
            placeholder="e.g., Introduction to Strumming Patterns"
          />

          <div className="space-y-2">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="notes"
                className="text-sm font-medium leading-none"
              >
                Lesson Notes (Optional)
              </label>
              {studentName && selectedSongs.length > 0 && (
                <LessonNotesAI
                  studentName={studentName}
                  studentId={formData.student_id}
                  songsCovered={selectedSongs.map((s) => s.title)}
                  lessonTopic={formData.title || 'Guitar Lesson'}
                  onNotesGenerated={(notes) => onFieldChange('notes', notes)}
                  disabled={!formData.title}
                />
              )}
            </div>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes || ''}
              onChange={(e) => onFieldChange('notes', e.target.value)}
              onBlur={() => onBlur('notes')}
              rows={8}
              placeholder="Add notes about what was covered, homework assigned, student progress, etc."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm resize-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              data-testid="field-notes"
            />
            {errors.notes && (
              <p className="text-sm text-destructive" role="alert">
                {errors.notes}
              </p>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <StepWizardForm
      steps={steps}
      formData={formData as unknown as Record<string, unknown>}
      errors={errors}
      submitLabel="Save Lesson"
    />
  );
}
