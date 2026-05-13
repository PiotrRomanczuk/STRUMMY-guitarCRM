/**
 * Extended student shape for V2 teacher dashboard.
 * Alpha's action will populate these fields; until then components use ?? defaults.
 */
export interface StudentV2 {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  lessonsCompleted: number;
  /** ISO string — when the student's last lesson took place */
  lastLessonAt: string | null;
  /** ISO string — when the student's next lesson is scheduled */
  nextLessonAt: string | null;
  overdueAssignmentCount: number;
  repertoireCount: number;
  avatar?: string;
}

export interface ChartDataPoint {
  /** Day label e.g. "Mon" */
  day: string;
  lessons: number;
  assignmentsCreated: number;
}

export interface WeeklySummary {
  lessonsTaught: number;
  lessonsScheduled: number;
  assignmentsCreated: number;
  assignmentsCompleted: number;
}

/** Mirrors TeacherDashboardData.needsAttention item shape */
export interface NeedsAttentionItem {
  id: string;
  studentId: string;
  studentName: string;
  reason: 'no_recent_lesson' | 'overdue_assignment' | 'inactive';
  daysAgo: number;
  actionUrl: string;
}
