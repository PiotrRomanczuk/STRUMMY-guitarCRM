import type { SongStatusKey } from '../lib/types';

export type LessonStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type LessonSongRef = {
  songId: string;
  progress: SongStatusKey;
  note?: string;
};

export type LessonAssignment = {
  id: string;
  title: string;
  status: 'open' | 'done';
  due: string;
};

export type StudentLesson = {
  id: string;
  number: number;
  title: string;
  studentId: string;
  scheduledAt: string;
  duration: number;
  status: LessonStatus;
  songs: LessonSongRef[];
  notes: string;
  assignments: LessonAssignment[];
};

export type SongRef = {
  id: string;
  title: string;
  author: string;
  year: number | null;
  key: string;
  level: string;
};

export type RepertoireSong = {
  id: string;
  status: SongStatusKey;
  since: string;
  mins: number;
};

export type TeacherNote = {
  date: string;
  text: string;
};

export type StudentAssignmentCard = {
  title: string;
  due: string;
  daysLeft: number;
  status: 'open' | 'done';
};

export type DateParts = {
  mon: string;
  day: number;
  year: number;
  wday: string;
};
