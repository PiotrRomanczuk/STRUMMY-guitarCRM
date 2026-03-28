'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Grid3X3, Music, Type, User } from 'lucide-react';
import {
  StitchFormShell,
  StitchSection,
  StitchFieldLabel,
  StitchInput,
  StitchSelect,
  StitchPickerButton,
  StitchButton,
} from '@/components/v2/stitch';
import useLessonForm from '@/components/lessons/hooks/useLessonForm';
import { useSongs } from '@/components/lessons/hooks/useSongs';
import { StudentPicker, SongPicker } from '@/components/v2/lessons/LessonForm.Pickers';
import { generateRecurringDates } from '@/lib/lessons/recurring-dates';
import { generateRecurringLessons } from '@/app/dashboard/lessons/recurring-actions';
import { DAY_OF_WEEK_OPTIONS, WEEK_OPTIONS } from '@/schemas/RecurringLessonSchema';
import { PreviewDateList } from './RecurringLessonFormStitch.Preview';
import { SelectedSongList } from './RecurringLessonFormStitch.SongList';

interface RecurringLessonFormStitchProps {
  initialData?: { student_id?: string; song_ids?: string[] };
}

export function RecurringLessonFormStitch({ initialData }: RecurringLessonFormStitchProps) {
  const router = useRouter();
  const { students, loading } = useLessonForm({ initialData: { student_id: initialData?.student_id ?? '' } });
  const { songs } = useSongs();

  const [studentId, setStudentId] = useState(initialData?.student_id ?? '');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [time, setTime] = useState('10:00');
  const [weeks, setWeeks] = useState('4');
  const [songIds, setSongIds] = useState<string[]>(initialData?.song_ids ?? []);
  const [titleTemplate, setTitleTemplate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStudentPicker, setShowStudentPicker] = useState(false);
  const [showSongPicker, setShowSongPicker] = useState(false);

  const selectedStudent = useMemo(() => students.find((s) => s.id === studentId), [students, studentId]);
  const previewDates = useMemo(
    () => generateRecurringDates({ dayOfWeek: Number(dayOfWeek), time, weeks: Number(weeks) }),
    [dayOfWeek, time, weeks]
  );
  const dayOptions = DAY_OF_WEEK_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }));
  const weekOptions = WEEK_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }));

  const handleSubmit = useCallback(async () => {
    if (!studentId) return;
    setIsSubmitting(true);
    try {
      const result = await generateRecurringLessons({
        studentId,
        dayOfWeek: Number(dayOfWeek),
        time,
        weeks: Number(weeks),
        titleTemplate: titleTemplate || undefined,
        songIds: songIds.length > 0 ? songIds : undefined,
      });
      if ('error' in result) throw new Error(result.error);
      router.push('/dashboard/lessons');
    } finally {
      setIsSubmitting(false);
    }
  }, [studentId, dayOfWeek, time, weeks, titleTemplate, songIds, router]);

  const handleToggleSong = useCallback((song: { id: string }) => {
    setSongIds((prev) =>
      prev.includes(song.id) ? prev.filter((id) => id !== song.id) : [...prev, song.id]
    );
  }, []);

  const selectedSongs = useMemo(() => songs.filter((s) => songIds.includes(s.id)), [songs, songIds]);

  if (loading) return null;

  return (
    <StitchFormShell title="Recurring Lessons" subtitle="Generate a weekly series">
      <div className="space-y-4">
        {/* Student */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <StitchFieldLabel label="Student" required />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Required
            </span>
          </div>
          <StitchPickerButton
            icon={<User className="h-5 w-5" />}
            placeholder="Tap to select a student..."
            selectedLabel={selectedStudent?.full_name ?? selectedStudent?.email}
            onClick={() => setShowStudentPicker(true)}
          />
        </div>

        {/* Schedule */}
        <StitchSection icon={<Calendar className="h-5 w-5" />} title="Schedule" collapsible={false}>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <StitchFieldLabel label="Day of Week" />
                <StitchSelect
                  id="dayOfWeek"
                  value={dayOfWeek}
                  options={dayOptions}
                  onChange={setDayOfWeek}
                />
              </div>
              <div>
                <StitchFieldLabel label="Start Time" />
                <StitchInput id="time" value={time} type="time" onChange={setTime} />
              </div>
            </div>
            <div>
              <StitchFieldLabel label="Number of Weeks" />
              <StitchSelect id="weeks" value={weeks} options={weekOptions} onChange={setWeeks} />
            </div>
          </div>
        </StitchSection>

        {/* Songs (optional, collapsible) */}
        <StitchSection
          icon={<Music className="h-5 w-5" />}
          title="Songs"
          defaultOpen={false}
          collapsible
        >
          <div className="mt-2 space-y-2">
            <StitchPickerButton
              icon={<Music className="h-5 w-5" />}
              placeholder="Tap to add songs..."
              selectedLabel={songIds.length > 0 ? `${songIds.length} song(s) selected` : undefined}
              onClick={() => setShowSongPicker(true)}
            />
            <SelectedSongList songs={selectedSongs} />
          </div>
        </StitchSection>

        {/* Title Template (collapsible) */}
        <StitchSection
          icon={<Type className="h-5 w-5" />}
          title="Title Template"
          defaultOpen={false}
          collapsible
        >
          <div className="mt-2">
            <StitchInput
              id="titleTemplate"
              value={titleTemplate}
              placeholder="Lesson #{n} — Guitar Basics"
              onChange={setTitleTemplate}
            />
          </div>
        </StitchSection>

        {/* Preview */}
        <StitchSection
          icon={<Calendar className="h-5 w-5" />}
          title={`Preview (${previewDates.length} lessons)`}
          collapsible={false}
        >
          <PreviewDateList dates={previewDates} />
        </StitchSection>

        {/* Submit */}
        <StitchButton
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={!studentId || isSubmitting}
          icon={<Grid3X3 className="h-4 w-4" />}
          className="w-full"
        >
          Generate {previewDates.length} Lessons
        </StitchButton>
      </div>

      {/* Pickers */}
      <StudentPicker
        open={showStudentPicker}
        onOpenChange={setShowStudentPicker}
        students={students}
        onSelect={(s) => { setStudentId(s.id); setShowStudentPicker(false); }}
      />
      <SongPicker
        open={showSongPicker}
        onOpenChange={setShowSongPicker}
        songs={songs}
        selectedSongIds={songIds}
        onSelect={handleToggleSong}
      />
    </StitchFormShell>
  );
}
