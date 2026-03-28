'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Music, Calendar, Check } from 'lucide-react';
import useLessonForm, { type LessonFormData } from '@/components/lessons/hooks/useLessonForm';
import { useSongs } from '@/components/lessons/hooks/useSongs';
import { StudentPicker, SongPicker } from '@/components/v2/lessons/LessonForm.Pickers';
import {
  StitchFormShell, StitchSection, StitchFieldLabel, StitchInput,
  StitchTextarea, StitchPickerButton, StitchFormActions, StitchAlert,
} from '@/components/v2/stitch';
import { SongCards } from './LessonFormStitch.SongCards';
import { WorkspaceTip } from './LessonFormStitch.Tip';

interface LessonFormStitchProps {
  initialData?: Partial<LessonFormData>;
  lessonId?: string;
}

function syntheticEvent(name: string, value: string) {
  return { target: { name, value } } as React.ChangeEvent<HTMLInputElement>;
}

export function LessonFormStitch({ initialData, lessonId }: LessonFormStitchProps) {
  const router = useRouter();
  const {
    formData, students, loading, error, validationErrors,
    handleChange, handleBlur, handleSongChange, handleSubmit,
  } = useLessonForm({ initialData, lessonId });
  const { songs } = useSongs();

  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [isSongPickerOpen, setIsSongPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedStudent = students.find((s) => s.id === formData.student_id);
  const songIds = formData.song_ids ?? [];

  const handleStudentSelect = useCallback(
    (student: { id: string; full_name: string | null; email: string }) => {
      handleChange(syntheticEvent('student_id', student.id));
      setIsStudentPickerOpen(false);
    },
    [handleChange]
  );

  const handleSongSelect = useCallback(
    (song: { id: string; title: string; author: string }) => {
      const current = formData.song_ids ?? [];
      handleSongChange(
        current.includes(song.id) ? current.filter((id) => id !== song.id) : [...current, song.id]
      );
    },
    [formData.song_ids, handleSongChange]
  );

  const handleRemoveSong = useCallback(
    (songId: string) => handleSongChange(songIds.filter((id) => id !== songId)),
    [songIds, handleSongChange]
  );

  const onSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await handleSubmit();
    setIsSubmitting(false);
    if (result.success) router.push('/lessons');
  }, [handleSubmit, router]);

  return (
    <form onSubmit={onSubmit}>
      <StitchFormShell title={lessonId ? 'Edit Lesson' : 'New Lesson'} subtitle="Schedule a session">
        <div className="space-y-5">
          {error && <StitchAlert message={error} />}

          <div>
            <StitchFieldLabel label="Student" required dotColor="bg-[#f2b127]" />
            <StitchPickerButton
              icon={<User className="h-5 w-5" />}
              placeholder="Tap to select a student..."
              selectedLabel={selectedStudent?.full_name ?? selectedStudent?.email}
              onClick={() => setIsStudentPickerOpen(true)}
            />
            {validationErrors.student_id && (
              <p className="text-xs text-red-500 mt-1" role="alert">{validationErrors.student_id}</p>
            )}
          </div>

          <div>
            <StitchFieldLabel label="Songs" dotColor="bg-stone-300" />
            <StitchPickerButton
              icon={<Music className="h-5 w-5" />}
              placeholder="Tap to add songs..."
              selectedLabel={
                songIds.length ? `${songIds.length} song${songIds.length > 1 ? 's' : ''} selected` : undefined
              }
              onClick={() => setIsSongPickerOpen(true)}
            />
            <SongCards songs={songs} selectedIds={songIds} onRemove={handleRemoveSong} />
          </div>

          <div>
            <StitchFieldLabel label="Schedule" required dotColor="bg-[#f2b127]" />
            <div className="flex items-center gap-2">
              <span className="shrink-0 w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500">
                <Calendar className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <StitchInput
                  id="scheduled_at"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(val) => handleChange(syntheticEvent('scheduled_at', val))}
                  onBlur={() => handleBlur('scheduled_at')}
                  error={validationErrors.scheduled_at}
                />
              </div>
            </div>
          </div>

          <StitchSection title="Details" fieldCount={2} defaultOpen={false}>
            <div className="space-y-4 mt-3">
              <div>
                <StitchFieldLabel label="Title" />
                <StitchInput
                  id="title"
                  value={formData.title ?? ''}
                  placeholder="Lesson title (optional)"
                  onChange={(val) => handleChange(syntheticEvent('title', val))}
                  onBlur={() => handleBlur('title')}
                  error={validationErrors.title}
                />
              </div>
              <div>
                <StitchFieldLabel label="Notes" />
                <StitchTextarea
                  id="notes"
                  value={formData.notes ?? ''}
                  placeholder="Session notes (optional)"
                  rows={3}
                  onChange={(val) => handleChange(syntheticEvent('notes', val))}
                  onBlur={() => handleBlur('notes')}
                  error={validationErrors.notes}
                />
              </div>
            </div>
          </StitchSection>

          <WorkspaceTip />
        </div>
      </StitchFormShell>

      <StitchFormActions
        onCancel={() => router.back()}
        submitLabel="Create Lesson"
        loading={isSubmitting || loading}
        disabled={isSubmitting || loading}
        submitIcon={<Check className="h-4 w-4" />}
      />

      <StudentPicker
        open={isStudentPickerOpen}
        onOpenChange={setIsStudentPickerOpen}
        students={students}
        onSelect={handleStudentSelect}
      />
      <SongPicker
        open={isSongPickerOpen}
        onOpenChange={setIsSongPickerOpen}
        songs={songs}
        selectedSongIds={songIds}
        onSelect={handleSongSelect}
      />
    </form>
  );
}
