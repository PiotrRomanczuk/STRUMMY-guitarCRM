-- Song Statistics Improvements
-- Adds engagement materialized view, indexes, and fixes mv_song_popularity

-- 1. Index for engagement queries on student_repertoire
CREATE INDEX IF NOT EXISTS ix_student_repertoire_song_status
  ON student_repertoire (song_id, current_status);

-- 2. Materialized view: per-song engagement metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_song_engagement AS
SELECT
  s.id AS song_id,
  s.title,
  s.author,
  s.level::text AS level,
  s.key::text AS key,
  s.category,
  COUNT(DISTINCT sr.student_id) AS total_students,
  COUNT(DISTINCT sr.student_id) FILTER (WHERE sr.current_status = 'mastered') AS mastered_count,
  COUNT(DISTINCT sr.student_id) FILTER (WHERE sr.is_active = true) AS active_learners,
  COALESCE(AVG(sr.total_practice_minutes)::int, 0) AS avg_practice_minutes,
  COALESCE(ROUND(AVG(sr.difficulty_rating)::numeric, 1), 0) AS avg_difficulty,
  COUNT(DISTINCT ls.lesson_id) AS lesson_appearances,
  MAX(GREATEST(sr.updated_at, ls.updated_at)) AS last_activity
FROM songs s
LEFT JOIN student_repertoire sr ON sr.song_id = s.id
LEFT JOIN lesson_songs ls ON ls.song_id = s.id
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.title, s.author, s.level, s.key, s.category;

CREATE UNIQUE INDEX IF NOT EXISTS ix_mv_song_engagement_pk
  ON mv_song_engagement (song_id);
CREATE INDEX IF NOT EXISTS ix_mv_song_engagement_popularity
  ON mv_song_engagement (total_students DESC);

-- 3. Drop and recreate mv_song_popularity using student_repertoire
-- (Original referenced deprecated student_song_progress table)
DROP MATERIALIZED VIEW IF EXISTS mv_song_popularity;

CREATE MATERIALIZED VIEW mv_song_popularity AS
SELECT
  s.id AS song_id,
  s.title,
  s.author,
  s.level::text AS level,
  COUNT(DISTINCT sr.student_id) AS times_assigned,
  COUNT(DISTINCT sr.student_id) AS unique_students,
  COUNT(DISTINCT sr.student_id) FILTER (WHERE sr.current_status = 'mastered') AS mastery_count,
  CASE
    WHEN COUNT(DISTINCT sr.student_id) > 0
    THEN ROUND(
      COUNT(DISTINCT sr.student_id) FILTER (WHERE sr.current_status = 'mastered')::numeric /
      COUNT(DISTINCT sr.student_id) * 100, 1
    )
    ELSE 0
  END AS mastery_rate,
  COALESCE(ROUND(AVG(sr.difficulty_rating)::numeric, 1), 0) AS avg_difficulty_rating
FROM songs s
LEFT JOIN student_repertoire sr ON sr.song_id = s.id
WHERE s.deleted_at IS NULL
GROUP BY s.id, s.title, s.author, s.level;

CREATE UNIQUE INDEX ON mv_song_popularity (song_id);
CREATE INDEX ON mv_song_popularity (times_assigned DESC);
CREATE INDEX ON mv_song_popularity (level, times_assigned DESC);

-- 4. Refresh function for engagement views
CREATE OR REPLACE FUNCTION refresh_song_engagement()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_song_engagement;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_song_popularity;
END;
$$;
