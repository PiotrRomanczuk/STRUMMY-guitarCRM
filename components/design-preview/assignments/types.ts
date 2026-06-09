import type { Student } from '../lib/types';

export type AssignmentStatusKey = 'open' | 'submitted' | 'done' | 'overdue';

export type Assignment = {
  id: string;
  student: Student;
  song: string;
  task: string;
  goal?: string;
  due: string;
  assignedAt: string;
  status: AssignmentStatusKey;
  submitted: string | null;
  lastPractice: string;
  progress: number;
};

export type AssignmentStatusStyle = {
  label: string;
  color: string;
  tint: string;
};

export type ChordName = 'G' | 'Em' | 'C' | 'D' | 'Am' | 'E' | 'A' | 'F' | 'Bm';
