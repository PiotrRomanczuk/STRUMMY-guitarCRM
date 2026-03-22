'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { MobilePageShell } from '@/components/v2/primitives';
import { StudentPicker, SongPicker } from './LessonForm.Pickers';
import { StudentStep, SongsStep } from './LessonForm.Steps';
import { RecurringPreview } from './RecurringLessonForm.Preview';
import { RecurringSchedule } from './RecurringLessonForm.Schedule';
import { Button } from '@/components/ui/button';
import useLessonForm from '@/components/lessons/hooks/useLessonForm';
import { useSongs } from '@/components/lessons/hooks/useSongs';
import { generateRecurringDates } from '@/lib/lessons/recurring-dates';
import { generateRecurringLessons } from '@/app/dashboard/lessons/recurring-actions';

interface RecurringLessonFormProps {
  initialData?: { student_id?: string; song_ids?: string[] };
}

export function RecurringLessonForm({ initialData }: RecurringLessonFormProps) {
  const router = useRouter();
  const { students, loading } = useLessonForm({ initialData });
  const { songs } = useSongs();

  const [studentId, setStudentId] = useState(initialData?.student_id ?? '');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [time, setTime] = useState('15:00');
  const [weeks, setWeeks] = useState(4);
  const [titleTemplate, setTitleTemplate] = useState('');
  const [songIds, setSongIds] = useState<string[]>(initialData?.song_ids ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [songPickerOpen, setSongPickerOpen] = useState(false);

  const selectedStudent = students.find((s) => s.id === studentId);
  const selectedSongs = songs.filter((s) => songIds.includes(s.id));

  const previewDates = useMemo(
    () => generateRecurringDates({ dayOfWeek, time, weeks }),
    [dayOfWeek, time, weeks]
  );

  const handleStudentSelect = useCallback(
    (student: { id: string; full_name: string | null; email: string }) => {
      setStudentId(student.id);
    },
    []
  );

  const toggleSong = useCallback(
    (song: { id: string; title: string; author: string }) => {
      setSongIds((prev) =>
        prev.includes(song.id)
          ? prev.filter((id) => id !== song.id)
          : [...prev, song.id]
      );
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!studentId) {
      toast.error('Please select a student');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await generateRecurringLessons({
        studentId,
        dayOfWeek,
        time,
        weeks,
        titleTemplate: titleTemplate || undefined,
        songIds: songIds.length > 0 ? songIds : undefined,
      });
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`Created ${result.created} recurring lessons`);
      router.push('/dashboard/lessons?created=true');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create lessons');
    } finally {
      setIsSubmitting(false);
    }
  }, [studentId, dayOfWeek, time, weeks, titleTemplate, songIds, router]);

  if (loading) {
    return (
      <MobilePageShell title="Recurring Lessons">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </MobilePageShell>
    );
  }

  return (
    <MobilePageShell title="Recurring Lessons" subtitle="Generate a weekly series">
      <div className="space-y-6">
        <StudentStep
          selectedStudent={selectedStudent}
          onOpen={() => setStudentPickerOpen(true)}
        />

        <RecurringSchedule
          dayOfWeek={dayOfWeek}
          time={time}
          weeks={weeks}
          titleTemplate={titleTemplate}
          onDayOfWeekChange={setDayOfWeek}
          onTimeChange={setTime}
          onWeeksChange={setWeeks}
          onTitleTemplateChange={setTitleTemplate}
        />

        <SongsStep selectedSongs={selectedSongs} onOpen={() => setSongPickerOpen(true)} />

        <RecurringPreview dates={previewDates} />

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !studentId}
          className="w-full min-h-[44px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            `Generate ${previewDates.length} Lessons`
          )}
        </Button>
      </div>

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
        selectedSongIds={songIds}
        onSelect={toggleSong}
      />
    </MobilePageShell>
  );
}
