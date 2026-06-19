export interface LessonFormData {
  student_id: string;
  teacher_id: string;
  scheduled_at: string;
  title?: string;
  notes?: string;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  song_ids?: string[];
}

export interface ValidationErrors {
  [key: string]: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

export interface UseLessonFormProps {
  initialData?: Partial<LessonFormData>;
  lessonId?: string;
  partial?: boolean;
  fieldsToSubmit?: (keyof LessonFormData)[];
}
