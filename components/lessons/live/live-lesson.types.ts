import { Database } from '@/database.types';

export type LessonSongStatus = Database['public']['Enums']['lesson_song_status'];

export const SONG_STATUS_ORDER: LessonSongStatus[] = [
  'to_learn',
  'started',
  'remembered',
  'with_author',
  'mastered',
];

export const STATUS_LABELS: Record<LessonSongStatus, string> = {
  to_learn: 'To Learn',
  started: 'Started',
  remembered: 'Remembered',
  with_author: 'Play Along',
  mastered: 'Mastered',
};

export const STATUS_COLORS: Record<LessonSongStatus, { bg: string; text: string; ring: string }> = {
  to_learn: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    ring: 'ring-slate-300 dark:ring-slate-600',
  },
  started: {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    ring: 'ring-blue-300 dark:ring-blue-600',
  },
  remembered: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
    ring: 'ring-amber-300 dark:ring-amber-600',
  },
  with_author: {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-700 dark:text-purple-300',
    ring: 'ring-purple-300 dark:ring-purple-600',
  },
  mastered: {
    bg: 'bg-green-100 dark:bg-green-900/40',
    text: 'text-green-700 dark:text-green-300',
    ring: 'ring-green-300 dark:ring-green-600',
  },
};

export interface LiveLessonSong {
  id: string;
  status: LessonSongStatus;
  notes: string | null;
  song: {
    id: string;
    title: string;
    author: string;
  } | null;
}

export interface LiveLessonData {
  id: string;
  title: string | null;
  notes: string | null;
  status: string | null;
  scheduledAt: string;
  studentName: string;
  lessonSongs: LiveLessonSong[];
}
