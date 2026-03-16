export interface TheoryCourse {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  level: string;
  is_published: boolean;
  lesson_count: number;
  sort_order: number;
  created_at: string;
}

export interface TheoryLesson {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterNav {
  id: string;
  title: string;
}
