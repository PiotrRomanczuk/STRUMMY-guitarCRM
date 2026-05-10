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

/** Per-day entry for the student's current-week chart (Mon..Sun). */
export type StudentChartDay = {
  /** Short day name: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun' */
  day: string;
  /** Number of lessons scheduled on this day */
  lessons: number;
  /**
   * Total practice minutes logged on this day via practice_sessions.
   * 0 when no practice_sessions rows exist for the day.
   * NOTE: practiceMinutes is derived from practice_sessions.created_at
   * grouped by day (UTC). If the practice_sessions table has no rows for
   * this student this week, all values will be 0.
   */
  practiceMinutes: number;
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
    status: 'not_started' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
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
  /**
   * Consecutive days (ending today or yesterday) where the student
   * practiced at least one song. Derived from student_repertoire.last_practiced_at
   * for the last 30 days. Returns 0 if no practice in that window.
   */
  practiceStreakDays: number;
  /**
   * Per-day chart data for the current week, ordered Mon..Sun.
   * See StudentChartDay for field semantics.
   */
  realChartData: StudentChartDay[];
};
