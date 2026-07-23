export const formatLessonDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const formatLessonClock = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

export const formatLessonWeekday = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { weekday: 'short' });

/** "45 min" — null when the lesson has no recorded duration. */
export const formatLessonDuration = (minutes: number | null): string | null =>
  minutes == null ? null : `${minutes} min`;

const LESSON_FORMAT_LABELS: Record<string, string> = {
  in_person: 'In person',
  video: 'Video call',
};

/** "In person" / "Video call" — null when the lesson has no recorded format. */
export const formatLessonFormat = (format: string | null): string | null =>
  format == null ? null : (LESSON_FORMAT_LABELS[format] ?? format);
