'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useLessonForm, { UseLessonFormProps } from '../hooks/useLessonForm';
import { useSongs } from '../hooks/useSongs';
import { ProfileSelect } from './LessonForm.ProfileSelect';
import { SongSelect } from './LessonForm.SongSelect';
import { LessonFormFields } from './LessonForm.Fields';
import { LessonFormActions } from './LessonForm.Actions';
import MobileLessonForm from './MobileLessonForm';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useFormErrorFocus } from '@/hooks/use-form-error-focus';
import { useMediaQuery } from '@/hooks/use-media-query';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export default function LessonForm(props: UseLessonFormProps) {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const {
    formData,
    students,
    teachers,
    loading,
    error,
    validationErrors,
    handleChange,
    handleBlur,
    handleSongChange,
    handleSubmit,
  } = useLessonForm(props);

  const { songs } = useSongs();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  useFormErrorFocus(validationErrors, formRef);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await handleSubmit();
      if (result.success) {
        if (props.lessonId) {
          toast.success('Lesson updated successfully');
          router.push(`/dashboard/lessons/${props.lessonId}`);
        } else {
          toast.success('Lesson created successfully');
          router.push('/dashboard/lessons?created=true');
        }
      }
    } catch (err) {
      logger.error('[LessonForm] Exception during submission:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 sm:p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading form...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get selected song titles for AI assistant
  const selectedSongs = songs
    .filter((song) => formData.song_ids?.includes(song.id))
    .map((song) => ({ title: song.title }));

  // Bridge: hook's event-based handleChange → value-based API for mobile form
  const handleFieldChange = (name: string, value: string) => {
    const syntheticEvent = {
      target: { name, value },
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(syntheticEvent);
  };

  return (
    <Card>
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isMobile ? (
            <MobileLessonForm
              formData={formData}
              errors={validationErrors}
              students={students}
              teachers={teachers}
              selectedSongs={selectedSongs}
              onFieldChange={handleFieldChange}
              onBlur={(field) => handleBlur(field as keyof typeof formData)}
              onSongChange={handleSongChange}
            />
          ) : (
            <>
              <ProfileSelect
                name="student_id"
                label="Student"
                value={formData.student_id}
                onChange={handleChange}
                options={students}
                error={validationErrors.student_id}
              />

              <ProfileSelect
                name="teacher_id"
                label="Teacher"
                value={formData.teacher_id}
                onChange={handleChange}
                options={teachers}
                error={validationErrors.teacher_id}
              />

              <LessonFormFields
                formData={formData}
                validationErrors={validationErrors}
                handleChange={handleChange}
                handleBlur={(field) => handleBlur(field as keyof typeof formData)}
                studentName={students.find((s) => s.id === formData.student_id)?.full_name || ''}
                studentId={formData.student_id}
                selectedSongs={selectedSongs}
              />

              <SongSelect
                selectedSongIds={formData.song_ids || []}
                onChange={handleSongChange}
                error={validationErrors.song_ids}
                studentId={formData.student_id}
              />

              <LessonFormActions
                isSubmitting={isSubmitting}
                onCancel={() => router.push('/dashboard/lessons')}
                isEditing={!!props.lessonId}
              />
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
