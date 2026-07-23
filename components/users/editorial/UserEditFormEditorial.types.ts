export type StudentStatus = 'lead' | 'trial' | 'active' | 'inactive' | 'churned';

export type EditableUser = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isActive: boolean;
  studentStatus: StudentStatus;
  // Student intake metadata (see 20260723120200_profiles_student_fields.sql).
  studentEmail: string | null;
  skillLevel: string | null;
  instrument: string | null;
  startDate: string | null;
  avatarColor: string | null;
  parentName: string | null;
  parentEmail: string | null;
  lessonDay: string | null;
  lessonTime: string | null;
  lessonDurationMinutes: number | null;
  lessonRate: number | null;
  billingCycle: string | null;
  goals: string | null;
};
