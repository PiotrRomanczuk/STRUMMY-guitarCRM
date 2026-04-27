export interface HashtagSet {
  id: string;
  name: string;
  description: string | null;
  hashtags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateHashtagSetDTO = Pick<HashtagSet, 'name' | 'hashtags'> &
  Partial<Pick<HashtagSet, 'description' | 'is_active'>>;

export type UpdateHashtagSetDTO = Partial<
  Pick<HashtagSet, 'name' | 'description' | 'hashtags' | 'is_active'>
>;
