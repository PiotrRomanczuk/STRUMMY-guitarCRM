export type ContentPlatform = 'tiktok' | 'instagram' | 'youtube_shorts';

export type ContentPostStatus = 'planned' | 'scheduled' | 'published' | 'archived' | 'failed';

export interface PostStories {
  morning?: string;
  afternoon?: string;
  evening?: string;
}

export interface ContentPost {
  id: string;
  song_id: string;
  song_video_id: string | null;
  platform: ContentPlatform;
  status: ContentPostStatus;

  scheduled_at: string | null;
  published_at: string | null;

  hook: string | null;
  caption: string | null;
  hashtag_set_ids: string[];
  extra_hashtags: string[];
  stories: PostStories;

  external_url: string | null;
  external_post_id: string | null;

  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  engagement_rate: number | null;
  metrics_updated_at: string | null;

  notes: string | null;

  created_at: string;
  updated_at: string;
}

export type CreateContentPostDTO = Pick<ContentPost, 'song_id' | 'platform'> &
  Partial<
    Pick<
      ContentPost,
      | 'song_video_id'
      | 'status'
      | 'scheduled_at'
      | 'published_at'
      | 'hook'
      | 'caption'
      | 'hashtag_set_ids'
      | 'extra_hashtags'
      | 'stories'
      | 'external_url'
      | 'external_post_id'
      | 'notes'
    >
  >;

export type UpdateContentPostDTO = Partial<
  Pick<
    ContentPost,
    | 'song_video_id'
    | 'platform'
    | 'status'
    | 'scheduled_at'
    | 'published_at'
    | 'hook'
    | 'caption'
    | 'hashtag_set_ids'
    | 'extra_hashtags'
    | 'stories'
    | 'external_url'
    | 'external_post_id'
    | 'notes'
  >
>;
