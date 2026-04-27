-- ============================================================================
-- Migration: Content Production
-- Adds content-calendar layer on top of song_videos:
--   - hashtag_sets (reusable bundles like CORE/SPECIFIC/TRENDING)
--   - content_posts (per-platform distribution slot)
--   - content_post_metrics (time-series snapshots of post performance)
-- Plus: production_status on song_videos and priority_bucket on songs.
-- All new tables: admin/teacher-only via RLS (no student access).
-- ============================================================================

-- ============================================================================
-- ALTER song_videos: production_status
-- ============================================================================

ALTER TABLE song_videos
  ADD COLUMN production_status text NOT NULL DEFAULT 'idea'
    CHECK (production_status IN ('idea', 'recording', 'edited', 'ready'));

CREATE INDEX idx_song_videos_production_status ON song_videos(production_status);

-- ============================================================================
-- ALTER songs: priority_bucket (preserves Excel song-level intent)
-- ============================================================================

ALTER TABLE songs
  ADD COLUMN priority_bucket text
    CHECK (priority_bucket IN ('done', 'may', 'june', 'later', 'backlog'));

CREATE INDEX idx_songs_priority_bucket ON songs(priority_bucket) WHERE priority_bucket IS NOT NULL;

-- ============================================================================
-- TABLE: hashtag_sets
-- ============================================================================

CREATE TABLE hashtag_sets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL UNIQUE,
  description  text,
  hashtags     text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_hashtag_sets_active ON hashtag_sets(is_active) WHERE is_active = true;

CREATE TRIGGER set_hashtag_sets_updated_at
  BEFORE UPDATE ON hashtag_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: content_posts
-- One row per (recording, platform) distribution slot.
-- ============================================================================

CREATE TABLE content_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id         uuid NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  song_video_id   uuid REFERENCES song_videos(id) ON DELETE SET NULL,
  platform        text NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube_shorts')),
  status          text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'scheduled', 'published', 'archived', 'failed')),

  -- Schedule
  scheduled_at    timestamptz,
  published_at    timestamptz,

  -- Content
  hook            text,
  caption         text,
  hashtag_set_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  extra_hashtags  text[] NOT NULL DEFAULT ARRAY[]::text[],
  stories         jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- External references
  external_url    text,
  external_post_id text,

  -- Current metrics snapshot
  views_count     integer NOT NULL DEFAULT 0,
  likes_count     integer NOT NULL DEFAULT 0,
  comments_count  integer NOT NULL DEFAULT 0,
  shares_count    integer NOT NULL DEFAULT 0,
  saves_count     integer NOT NULL DEFAULT 0,
  engagement_rate numeric(5,2),
  metrics_updated_at timestamptz,

  -- Notes
  notes           text,

  -- Timestamps
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  -- Natural-key uniqueness for idempotent backfill
  CONSTRAINT content_posts_unique_slot UNIQUE (song_id, platform, scheduled_at)
);

CREATE INDEX idx_content_posts_song ON content_posts(song_id);
CREATE INDEX idx_content_posts_song_video ON content_posts(song_video_id);
CREATE INDEX idx_content_posts_scheduled_at ON content_posts(scheduled_at);
CREATE INDEX idx_content_posts_platform_status ON content_posts(platform, status);

CREATE TRIGGER set_content_posts_updated_at
  BEFORE UPDATE ON content_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: content_post_metrics (time-series)
-- ============================================================================

CREATE TABLE content_post_metrics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  captured_at     timestamptz NOT NULL DEFAULT now(),
  views_count     integer NOT NULL DEFAULT 0,
  likes_count     integer NOT NULL DEFAULT 0,
  comments_count  integer NOT NULL DEFAULT 0,
  shares_count    integer NOT NULL DEFAULT 0,
  saves_count     integer NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_post_metrics_post_time ON content_post_metrics(post_id, captured_at DESC);

-- ============================================================================
-- TRIGGER: keep song_videos.published_to_<platform> denormalized in sync
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_song_video_published_flag()
RETURNS TRIGGER AS $$
DECLARE
  target_video_id uuid;
  any_published_tiktok    boolean;
  any_published_instagram boolean;
  any_published_youtube   boolean;
BEGIN
  target_video_id := COALESCE(NEW.song_video_id, OLD.song_video_id);
  IF target_video_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT
    bool_or(platform = 'tiktok'         AND status = 'published'),
    bool_or(platform = 'instagram'      AND status = 'published'),
    bool_or(platform = 'youtube_shorts' AND status = 'published')
  INTO any_published_tiktok, any_published_instagram, any_published_youtube
  FROM content_posts
  WHERE song_video_id = target_video_id;

  UPDATE song_videos
  SET
    published_to_tiktok          = COALESCE(any_published_tiktok, false),
    published_to_instagram       = COALESCE(any_published_instagram, false),
    published_to_youtube_shorts  = COALESCE(any_published_youtube, false)
  WHERE id = target_video_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_posts_sync_published_flag
  AFTER INSERT OR UPDATE OF status, song_video_id, platform OR DELETE ON content_posts
  FOR EACH ROW
  EXECUTE FUNCTION sync_song_video_published_flag();

-- ============================================================================
-- RLS: admin/teacher only on all three tables
-- ============================================================================

ALTER TABLE hashtag_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY hashtag_sets_select ON hashtag_sets
  FOR SELECT TO authenticated USING (is_admin_or_teacher());
CREATE POLICY hashtag_sets_insert ON hashtag_sets
  FOR INSERT TO authenticated WITH CHECK (is_admin_or_teacher());
CREATE POLICY hashtag_sets_update ON hashtag_sets
  FOR UPDATE TO authenticated USING (is_admin_or_teacher()) WITH CHECK (is_admin_or_teacher());
CREATE POLICY hashtag_sets_delete ON hashtag_sets
  FOR DELETE TO authenticated USING (is_admin_or_teacher());

ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_posts_select ON content_posts
  FOR SELECT TO authenticated USING (is_admin_or_teacher());
CREATE POLICY content_posts_insert ON content_posts
  FOR INSERT TO authenticated WITH CHECK (is_admin_or_teacher());
CREATE POLICY content_posts_update ON content_posts
  FOR UPDATE TO authenticated USING (is_admin_or_teacher()) WITH CHECK (is_admin_or_teacher());
CREATE POLICY content_posts_delete ON content_posts
  FOR DELETE TO authenticated USING (is_admin_or_teacher());

ALTER TABLE content_post_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_post_metrics_select ON content_post_metrics
  FOR SELECT TO authenticated USING (is_admin_or_teacher());
CREATE POLICY content_post_metrics_insert ON content_post_metrics
  FOR INSERT TO authenticated WITH CHECK (is_admin_or_teacher());
CREATE POLICY content_post_metrics_delete ON content_post_metrics
  FOR DELETE TO authenticated USING (is_admin_or_teacher());

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON hashtag_sets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON content_posts TO authenticated;
GRANT SELECT, INSERT, DELETE ON content_post_metrics TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE hashtag_sets IS 'Reusable hashtag bundles (e.g. core, specific, trending) for content posts';
COMMENT ON TABLE content_posts IS 'Per-platform distribution slot for a song video — calendar, caption, metrics';
COMMENT ON TABLE content_post_metrics IS 'Time-series snapshots of content_posts engagement metrics';
COMMENT ON COLUMN content_posts.stories IS 'JSONB { morning?, afternoon?, evening? } — story copy for the day';
COMMENT ON COLUMN content_posts.hashtag_set_ids IS 'FK array into hashtag_sets — combined per post';
COMMENT ON COLUMN song_videos.production_status IS 'Recording lifecycle: idea -> recording -> edited -> ready';
COMMENT ON COLUMN songs.priority_bucket IS 'Content-plan grouping (done/may/june/later/backlog)';
