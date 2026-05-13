export interface LessonQueryParams {
  userId?: string;
  studentId?: string;
  filter?: string;
  sort?: 'created_at' | 'date' | 'lesson_number';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface LessonError {
  error: string;
  status: number;
}

export interface UserProfile {
  isAdmin: boolean;
  isTeacher: boolean | null;
  isStudent: boolean | null;
}

export type SupabaseClient = Awaited<
  ReturnType<typeof import('../../../../lib/supabase/server').createClient>
>;
