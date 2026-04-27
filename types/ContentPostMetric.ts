export interface ContentPostMetric {
  id: string;
  post_id: string;
  captured_at: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  notes: string | null;
  created_at: string;
}

export type CreateContentPostMetricDTO = Pick<
  ContentPostMetric,
  'views_count' | 'likes_count' | 'comments_count' | 'shares_count' | 'saves_count'
> &
  Partial<Pick<ContentPostMetric, 'notes' | 'captured_at'>>;
