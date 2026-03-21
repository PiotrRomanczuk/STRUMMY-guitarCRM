import type { LessonWithProfiles } from '@/schemas/LessonSchema';

export type LessonRole = 'admin' | 'teacher' | 'student';

export interface LessonListV2Props {
  initialLessons: LessonWithProfiles[];
  role: LessonRole;
  currentYear: number;
  students?: StudentProfile[];
  teachers?: StudentProfile[];
  selectedStudentId?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onSyncCalendar?: () => void;
  isSyncing?: boolean;
  onYearChange?: (year: number) => void;
}

export interface StudentProfile {
  id: string;
  full_name: string | null;
  email: string;
}

export type LessonStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export const LESSON_STATUS_OPTIONS = [
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
] as const;
