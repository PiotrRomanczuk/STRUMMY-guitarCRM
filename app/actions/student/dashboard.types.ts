import type { SongProgressStatus, RepertoirePriority } from '@/types/StudentRepertoire';

export type DashboardRepertoireItem = {
  id: string;
  song_id: string;
  song_title: string;
  song_author: string | null;
  current_status: SongProgressStatus;
  priority: RepertoirePriority;
  last_practiced_at: string | null;
  total_practice_minutes: number;
  self_rating: number | null;
};

export type StudentDashboardData = {
  studentName: string | null;
  nextLesson: {
    id: string;
    title: string | null;
    scheduled_at: string;
  } | null;
  lastLesson: {
    id: string;
    title: string | null;
    scheduled_at: string;
    notes: string | null;
  } | null;
  assignments: {
    id: string;
    title: string;
    due_date: string | null;
    status: 'pending' | 'completed' | 'overdue';
    description: string | null;
  }[];
  recentSongs: {
    id: string;
    title: string;
    artist: string;
    last_played: string;
  }[];
  allSongs: {
    id: string;
    title: string;
    artist: string;
  }[];
  repertoire: DashboardRepertoireItem[];
  stats: {
    totalSongs: number;
    completedLessons: number;
    activeAssignments: number;
    practiceHours: number;
  };
};
