import type { SongStatusKey, Student } from '../lib/types';

export type LessonStatusKey = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export type LessonRole = 'teacher' | 'student' | 'admin';

export type LessonView = 'list' | 'detail';

export type LessonTeacher = {
  id: string;
  name: string;
  avatar: string;
  color: string;
};

export type LessonSongRef = {
  songId: string;
  progress: SongStatusKey;
  note: string;
};

export type LessonAssignment = {
  id: string;
  title: string;
  status: 'open' | 'done';
  due: string;
};

export type LessonRecord = {
  id: string;
  number: number;
  title: string;
  student: Student;
  teacher: LessonTeacher;
  scheduledAt: string;
  duration: number;
  status: LessonStatusKey;
  songs: LessonSongRef[];
  notes: string;
  assignments: LessonAssignment[];
};

export type LessonSongLib = {
  id: string;
  title: string;
  author: string;
  year: number | null;
  key: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
};

export type LessonStatusMeta = {
  label: string;
  color: string;
  tint: string;
};
