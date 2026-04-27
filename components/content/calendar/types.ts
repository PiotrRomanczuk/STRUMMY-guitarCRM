import type { ContentPost } from '@/types/ContentPost';

export interface CalendarEntry extends ContentPost {
  song: { id: string; title: string; author: string | null } | null;
}
