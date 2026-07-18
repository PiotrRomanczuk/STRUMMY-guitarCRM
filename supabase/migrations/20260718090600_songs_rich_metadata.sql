-- Songs: rich metadata columns (Phase 4, first slice). docs/DATABASE_REBUILD.md.
-- Pulled forward to the cutover so restoring the 438-song backup is LOSSLESS
-- (409 of them carry data beyond the minimal columns).
--
-- Data-driven deviations from the original Phase 4 sketch:
--   * `category` stays TEXT, not an enum — the live library has 31 messy free-text
--     genres ("Rock/Folk", "Metal Ballad", ...); an enum would be permanent churn.
--   * `priority_bucket` is NOT rebuilt — NULL on all 438 rows; dated planning artifact.

alter table public.songs
  add column if not exists capo_fret          integer   check (capo_fret between 0 and 20),
  add column if not exists strumming_pattern  text,
  add column if not exists tempo              integer   check (tempo between 20 and 300),
  add column if not exists time_signature     integer   check (time_signature between 1 and 16),
  add column if not exists duration_ms        integer   check (duration_ms > 0),
  add column if not exists release_year       integer   check (release_year between 1900 and 2100),
  add column if not exists category           text,
  add column if not exists youtube_url        text,
  add column if not exists spotify_link_url   text,
  add column if not exists tiktok_short_url   text,
  add column if not exists cover_image_url    text,
  add column if not exists gallery_images     text[],
  add column if not exists audio_files        jsonb     default '{}'::jsonb,
  add column if not exists is_draft           boolean   not null default false,
  add column if not exists notes              text,
  add column if not exists lyrics_with_chords text,
  add column if not exists recording_queued_at timestamptz,
  add column if not exists recorded_at         timestamptz;

-- Full-text search over title (A) + author (B). Generated/stored; app filters on it.
alter table public.songs
  add column if not exists search_vector tsvector
    generated always as (
      setweight(to_tsvector('simple', coalesce(title, '')),  'A') ||
      setweight(to_tsvector('simple', coalesce(author, '')), 'B')
    ) stored;

create index if not exists ix_songs_search on public.songs using gin (search_vector);
