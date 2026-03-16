'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useLessonForm from '@/components/lessons/hooks/useLessonForm';
import { useSongs } from '@/components/lessons/hooks/useSongs';
import { StepWizardForm, MobilePageShell } from '@/components/v2/primitives';
import { StudentStep, SongsStep, ScheduleStep, NotesStep } from './LessonForm.Steps';
import { StudentPicker, SongPicker } from './LessonForm.Pickers';
import type { LessonFormData } from '@/components/lessons/hooks/useLessonForm';

interface LessonFormV2Props {
  initialData?: Partial<LessonFormData>;
  lessonId?: string;
}

export function LessonFormV2({ initialData, lessonId }: LessonFormV2Props) {
  const router = useRouter();
  const {
    formData,
    students,
    loading,
    error,
    validationErrors,
    handleChange,
    handleBlur,
    handleSongChange,
    handleSubmit,
  } = useLessonForm({ initialData, lessonId });

  const { songs } = useSongs();
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [songPickerOpen, setSongPickerOpen] = useState(false);

  const selectedStudent = students.find((s) => s.id === formData.student_id);
  const selectedSongs = songs.filter((s) =>
    formData.song_ids?.includes(s.id)
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const result = await handleSubmit();
      if (result?.success) {
        toast.success(lessonId ? 'Lesson updated' : 'Lesson created');
        router.push('/dashboard/lessons?created=true');
      } else if (result && !result.success) {
        toast.error(result.error || 'Failed to save lesson');
      }
    },
    [handleSubmit, router, lessonId]
  );

  const handleStudentSelect = useCallback(
    (student: { id: string; full_name: string | null; email: string }) => {
      const event = {
        target: { name: 'student_id', value: student.id },
      } as React.ChangeEvent<HTMLInputElement>;
      handleChange(event);
    },
    [handleChange]
  );

  const toggleSong = useCallback(
    (song: { id: string; title: string; author: string }) => {
      const current = formData.song_ids ?? [];
      const newIds = current.includes(song.id)
        ? current.filter((id) => id !== song.id)
        : [...current, song.id];
      handleSongChange(newIds);
    },
    [formData.song_ids, handleSongChange]
  );

  if (loading) {
    return (
      <MobilePageShell title={lessonId ? 'Edit Lesson' : 'New Lesson'}>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </MobilePageShell>
    );
  }

  if (error && students.length === 0) {
    return (
      <MobilePageShell title={lessonId ? 'Edit Lesson' : 'New Lesson'}>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-sm text-primary underline"
          >
            Try again
          </button>
        </div>
      </MobilePageShell>
    );
  }

  const steps = [
    {
      label: 'Student',
      requiredFields: ['student_id'],
      content: (
        <StudentStep
          selectedStudent={selectedStudent}
          error={validationErrors.student_id}
          onOpen={() => setStudentPickerOpen(true)}
        />
      ),
    },
    {
      label: 'Songs',
      content: (
        <SongsStep
          selectedSongs={selectedSongs}
          onOpen={() => setSongPickerOpen(true)}
        />
      ),
    },
    {
      label: 'Schedule',
      requiredFields: ['scheduled_at'],
      content: (
        <ScheduleStep
          value={formData.scheduled_at}
          error={validationErrors.scheduled_at}
          onChange={handleChange}
          onBlur={() => handleBlur('scheduled_at')}
        />
      ),
    },
    {
      label: 'Notes',
      content: (
        <NotesStep
          title={formData.title ?? ''}
          notes={formData.notes ?? ''}
          onChange={handleChange}
        />
      ),
    },
  ];

  return (
    <MobilePageShell
      title={lessonId ? 'Edit Lesson' : 'New Lesson'}
      subtitle={`Step wizard${error ? ` — ${error}` : ''}`}
    >
      <form onSubmit={onSubmit}>
        <StepWizardForm
          steps={steps}
          formData={formData as unknown as Record<string, unknown>}
          errors={validationErrors}
          submitLabel={lessonId ? 'Update Lesson' : 'Create Lesson'}
        />
      </form>

      <StudentPicker
        open={studentPickerOpen}
        onOpenChange={setStudentPickerOpen}
        students={students}
        onSelect={handleStudentSelect}
      />

      <SongPicker
        open={songPickerOpen}
        onOpenChange={setSongPickerOpen}
        songs={songs}
        selectedSongIds={formData.song_ids ?? []}
        onSelect={toggleSong}
      />
    </MobilePageShell>
  );
}
