---
created: 2026-07-18
updated: 2026-07-18
domain: Content Production & Media
tables: [content_posts, content_post_metrics, hashtag_sets, song_videos, drive_files]
maturity: mixed
---

# Content Production & Media

## Purpose

The owner's video/social pipeline plus the app's Google-Drive media layer. Two distinct halves:

1. **Social pipeline** (`song_videos` production state + `content_posts` per-platform slots +
   `hashtag_sets` + `content_post_metrics`) — plan, publish, and track short-form guitar videos
   on TikTok / Instagram / YouTube Shorts.
2. **Drive media** (`drive_files`, and `song_videos` storage columns) — Google Drive files
   attached to songs, lessons, assignments, and profiles, streamed through the app.

**Strategic status (grill decision 2026-07-18): the social pipeline is PARKED.** It is marketing
tooling, not student trust, so it is excluded from the v1/v1.1 trust pass. Its gaps below carry
briefs but are explicitly "parked — backlog, not v1/v1.1". Drive media, by contrast, serves the
core loop (song/lesson attachments) and stays live.

## Data model

| Table                  | Role                                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `song_videos`          | A recording of a song stored on Drive: Drive file ids, duration/thumbnail, quality checklist (`is_recording_correct`, `is_well_lit`, `mic_type`, `is_audio_mixed`, `is_video_edited`), `production_status` (`idea → recording → edited → ready`), per-platform `published_to_*` flags + media ids, song `match_confidence`/`match_source` |
| `content_posts`        | Per-platform distribution slot for a video: `platform` (`tiktok/instagram/youtube_shorts`), `status` (`planned/scheduled/published/archived/failed`), schedule/publish times, hook/caption, `hashtag_set_ids[]` + extras, external ids, cached engagement counters                                                                        |
| `content_post_metrics` | Time-series snapshots of a post's engagement (views/likes/comments/shares/saves)                                                                                                                                                                                                                                                          |
| `hashtag_sets`         | Reusable named hashtag bundles referenced by posts                                                                                                                                                                                                                                                                                        |
| `drive_files`          | Polymorphic Drive attachments — see visibility model below                                                                                                                                                                                                                                                                                |

**`sync_song_video_published_flag()`** (trigger on `content_posts` insert/delete/status change):
recomputes the parent `song_videos.published_to_{tiktok,instagram,youtube_shorts}` flags from the
set of `published` posts, so the video row is always an accurate rollup of its distribution slots.

**`drive_files` polymorphic attachment + visibility model**: one row per Drive file, attached via
`entity_type` (`song/lesson/assignment/profile`) + `entity_id`; `file_type` in
`audio/pdf/video/document/image`; soft-delete via `deleted_at`; ordered by `display_order`.
Visibility is a three-level enum: **`private`** (uploader/teacher only), **`students`** (visible
to students linked to the entity), **`public`** (any authenticated user). Enforced by RLS plus
the `/api/drive/files*` handlers; binary content streams through
`/api/drive/files/[fileId]/stream` so Drive credentials never reach the client.

## Behavior & rules

- **Production checklist** — `song_videos.production_status` advances `idea → recording → edited
→ ready`; the boolean quality flags are the recording checklist
  (`RecordingQualityForm`).
- **Distribution** — a `ready` video gets one `content_posts` row per target platform; publishing
  is manual (external ids/URLs pasted back), no platform API integration.
- **Metrics** — entered manually via `PostMetricsForm`; each save appends a
  `content_post_metrics` snapshot and updates the cached counters on the post.
- **Drive scan** — `app/api/cron/drive-video-scan` (daily 03:00) walks the Drive folder via
  `lib/services/drive-video-sync.ts`, creates `song_videos` rows for new files, auto-matches
  them to songs (`match_source` `auto/manual/spotify`, `match_confidence` 0–100), and notifies
  admins.
- **API** — `/api/content/{posts,posts/[id],posts/[id]/metrics,hashtag-sets,calendar}` (RLS-scoped,
  teacher/admin only; ADR-0001 — handlers don't re-filter ownership);
  `/api/song/[id]/videos*` for per-song recordings; `/api/admin/drive-videos*` for the admin
  video pool; `/api/drive/files*` for generic attachments.

## UI surfaces

| Surface                 | Route / component                                                                                            | Status                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Production tab          | `components/songs/production/ProductionTab.tsx` inside `SongDetailTabs`                                      | **built-unmounted** — tab gated behind `{false &&}` |
| Post/metrics forms      | `PostList`, `PostFormDialog`, `PostMetricsForm`, `HashtagSetPicker`, `RecordingList`, `RecordingQualityForm` | built (children of ProductionTab)                   |
| Admin drive videos      | `/dashboard/admin/drive-videos`                                                                              | placeholder page → **unbuilt** UI                   |
| Song/lesson attachments | Drive file lists inside song & lesson detail (docs 02, 03)                                                   | **mounted** (via their domain editors)              |

**Blocker verification (2026-07-18)**: `SongDetailTabs.tsx` still hides the Production tab with a
comment "content_posts tables not yet live in prod (pending migration
`20260427120000_content_production.sql`)". That blocker is **stale**: `content_posts`,
`content_post_metrics`, and `hashtag_sets` are all present in the verified baseline
(`cloud_schema_2026-06-22.sql`) and therefore in StrummyProd. Nothing schema-side prevents
re-enabling the tab — it stays off only because the pipeline is parked. (Today's live stack,
StudentManager, predates the cutover; re-enable after cutover, not before.)

The old superseded-spec cleanup items (delete `AppSidebar` content nav entry, prune
`/dashboard/content/*` placeholders) are done — those routes and the nav entry no longer exist.

## Gaps & planned work

All gaps in this domain are **parked — backlog, not v1/v1.1** (grill decision 2026-07-18).

### CNT-1 — re-enable the Production tab (parked)

Flip the `{false && ...}` gate in `components/songs/editorial/SongDetailTabs.tsx`, delete the
stale blocker comment, and gate the tab to teacher/admin. Acceptance: tab renders recordings +
posts against StrummyProd; `/api/content/*` round-trips without 500s. Do after cutover.

### CNT-2 — admin drive-videos page (parked)

`/dashboard/admin/drive-videos` is a "Coming soon" placeholder while `/api/admin/drive-videos`
works. Build a review UI for the scanned pool (confirm/deny auto-matches using
`match_confidence`). Parked — operator tooling.

### CNT-3 — automated metrics ingestion (parked)

`content_post_metrics` is manual entry only. Platform-API ingestion is explicitly out of scope
until the pipeline itself is unparked.

## Test plan

- No dedicated E2E (parked domain; `reference/E2E_JOURNEYS.md` has no content-pipeline journey —
  A3.2 covers song attachments). When CNT-1 lands, add one journey: open Production tab → create
  post → enter metrics → snapshot persisted.
- **Unit/integration**: `/api/content/*` handler tests (Zod contracts in
  `schemas/ContentPostSchema.ts`, `schemas/HashtagSetSchema.ts`); `sync_song_video_published_flag`
  rollup belongs in a Jest integration test against local Supabase.

## Open questions

- Does `drive_files` eventually absorb `song_videos`' storage columns (one attachment model), or
  do recordings stay a separate table because of the production workflow fields? Revisit when the
  pipeline is unparked.

## References

- Superseded: `docs/specs/09-content-production.md` (deleted 2026-07-18; git history)
- Code: `components/songs/production/*`, `app/api/content/*`, `app/api/drive/files*`,
  `lib/services/drive-video-sync.ts`, `app/api/cron/drive-video-scan`
- Schema: `supabase/baseline/cloud_schema_2026-06-22.sql` (5 tables +
  `sync_song_video_published_flag`)
- Related domains: songs (03) for Spotify matching; admin (10) for the drive-scan cron
