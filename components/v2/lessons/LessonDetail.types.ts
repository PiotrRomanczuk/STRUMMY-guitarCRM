import type { LessonWithProfiles } from '@/schemas/LessonSchema';
import type { Database } from '@/database.types';

export interface LessonSongItem {
  id: string;
  status: Database['public']['Enums']['lesson_song_status'];
  song: { id: string; title: string; author: string } | null;
}

export interface LessonDetailV2Props {
  lesson: Omit<LessonWithProfiles, 'lesson_songs' | 'assignments'> & {
    lesson_songs: LessonSongItem[];
    assignments: {
      id: string;
      title: string;
      status: Database['public']['Enums']['assignment_status'];
      due_date: string | null;
    }[];
  };
  canEdit: boolean;
  canDelete: boolean;
  onDelete: () => void;
}
