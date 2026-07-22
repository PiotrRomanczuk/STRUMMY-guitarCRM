---
created: 2026-07-20
updated: 2026-07-20
source: https://www.tiktok.com/@justmeandguitars
captured: 2026-07-19
domain: 09-content-production (seed dataset)
---

# TikTok Channel Data — `@justmeandguitars`

A real capture of the owner's live TikTok channel, the same person who runs Strummy. It exists
here because the channel **is** the content-production pipeline (doc 09) running by hand today:
every post is a `content_posts` row waiting to be created, every view count a
`content_post_metrics` snapshot, every cover a `songs` row with a `tiktok` link. This doc is the
bridge between that real activity and the parked-but-built pipeline — a seed dataset, a demo
fixture, and the evidence that the 09 data model matches how the owner actually works.

**Not task state.** Per the blueprint precedence rules this is descriptive reference data, not a
backlog. The actionable hook lives in [09-content-production.md](../09-content-production.md) as
gap **CNT-4**; the vault owns whether/when it ships.

Capture caveats: single snapshot (view counts as of 2026-07-19, no likes/comments/shares —
TikTok's grid only exposes views); song/artist read from each video's caption + hashtags (high
confidence); full per-video URLs captured for the 2 pinned posts only, the rest need a re-crawl
(the grid virtualizes hrefs off-screen). Profile at capture: **845 followers, 461 following,
2095 likes, 29 videos.**

## How it maps onto the 09 data model

| Scraped element                         | Target table            | Column notes                                                                                     |
| --------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------ |
| One cover (song + artist)               | `songs`                 | `title`, `author`, `category='cover'`, `tiktok` media link; `recorded_at` set (it's published)   |
| The video itself                        | `song_videos`           | `production_status='ready'`, `published_to_tiktok=true`, `match_source='manual'`, `match_confidence=100` |
| The published TikTok post               | `content_posts`         | `platform='tiktok'`, `status='published'`, `caption`, `hashtag_set_ids[]`, `external_url`, cached view counter |
| The view count @ 2026-07-19             | `content_post_metrics`  | one snapshot row (`views`; likes/comments/shares/saves NULL — not exposed by the grid)            |
| Recurring hashtag bundle                | `hashtag_sets`          | see [Derived hashtag sets](#derived-hashtag-sets) — the base set + per-post extras               |

`sync_song_video_published_flag()` makes the mapping self-consistent: insert the `content_posts`
row as `published` and the parent `song_videos.published_to_tiktok` flag recomputes to true
automatically — so a backfill only writes posts, not flags.

## How the app would use it

1. **Un-hollow the demo / CNT-1.** When the Production tab (`components/songs/production/`) is
   re-enabled after cutover, it renders against real recordings + posts + metrics instead of an
   empty table. Directly serves the "recruiter-demo ready" push (commit `edd62e3a`).
2. **Backfill the real metric baseline.** Seed one `content_post_metrics` snapshot per post so the
   pipeline's time series starts from real history; the next manual `PostMetricsForm` entry appends
   to a real curve instead of a cold start.
3. **Seed the song catalog with proven material.** The 23 distinct covers become `songs` rows with
   their `tiktok` link populated — a song the teacher has publicly performed is demonstrably
   teachable, so this is a legitimate seed for the doc-03 catalog, not throwaway fixture data.
4. **Drive "what to record next".** The content-pipeline columns on `songs`
   (`recording_queued_at`, `priority_bucket`) get real signal: catalog songs with no
   `published_to_tiktok` video and high repertoire/assignment counts are recording candidates, and
   observed performance (below) sets the priority — classic rock overperforms, 2000s-alt
   underperforms, so bucket accordingly. (Also the natural place to fix the
   `priority_bucket` `'may'/'june'` hardcode smell flagged in doc 03 Open questions.)
5. **Give `hashtag_sets` real content on day one.** The recurring tag bundle seeds the default
   reusable set so `HashtagSetPicker` isn't empty; per-post artist/title tags become the `extras`.
6. **Test fixtures.** Real captions + hashtags + view snapshots exercise the `/api/content/*` Zod
   contracts (`ContentPostSchema`, `HashtagSetSchema`) and the
   `sync_song_video_published_flag` rollup integration test named in the doc-09 test plan.

## The dataset — 24 song covers

Ordered newest-first (profile order). Views @ 2026-07-19.

| # | Song                            | Artist                       | Views | Notes                              |
| - | ------------------------------- | ---------------------------- | ----- | ---------------------------------- |
| 1 | Wanted Dead or Alive            | Bon Jovi                     | 3353  | 📌 pinned                          |
| 2 | Wish You Were Here              | Pink Floyd                   | 7330  | 📌 pinned — top cover              |
| 3 | Sparks                          | Coldplay                     | 1012  |                                    |
| 4 | Come Together                   | The Beatles                  | 1064  |                                    |
| 5 | We Are the People               | Empire of the Sun            | 1281  |                                    |
| 6 | One                             | Metallica                    | 504   |                                    |
| 7 | I'll Be There for You           | The Rembrandts               | 591   | Friends theme                      |
| 8 | Play That Funky Music           | Wild Cherry                  | 1076  | electric — only electric cover     |
| 9 | Hallelujah                      | Leonard Cohen                | 604   | framed via the Shrek version       |
| 10| Wish You Were Here              | Pink Floyd                   | 1452  | 2nd take, "hiding a talent" hook   |
| 11| Banana Pancakes                 | Jack Johnson                 | 705   |                                    |
| 12| Enjoy the Silence               | Depeche Mode                 | 334   |                                    |
| 13| Wake Me Up When September Ends  | Green Day                    | 1165  |                                    |
| 14| Daughters                       | John Mayer                   | 996   |                                    |
| 15| Yellow Submarine                | The Beatles                  | 1251  |                                    |
| 16| Behind Blue Eyes                | The Who                      | 738   |                                    |
| 17| Stairway to Heaven              | Led Zeppelin                 | 715   |                                    |
| 18| Wonderwall                      | Oasis                        | 1689  |                                    |
| 19| Blackbird                       | The Beatles                  | 458   |                                    |
| 20| Hurt                            | Johnny Cash (Nine Inch Nails)| 393   |                                    |
| 21| Dust in the Wind                | Kansas                       | 848   |                                    |
| 22| Here Without You                | 3 Doors Down                 | 847   |                                    |
| 23| Drive                           | Incubus                      | 273   |                                    |
| 24| Norwegian Wood                  | The Beatles                  | 562   |                                    |

**Known video IDs** (pinned posts): #1 → `7630522092055842070`, #2 (Wish You Were Here, 7330) →
`7629779374874643734`. URL form: `https://www.tiktok.com/@justmeandguitars/video/<id>`.

## Non-song posts (5)

These are `content_posts` with no `song_videos` parent (nullable link) — engagement/community
content, not covers.

| Post                          | Views | Type                                        |
| ----------------------------- | ----- | ------------------------------------------- |
| Electric or acoustic guitar?  | 4299  | poll / engagement — **highest reach on the channel** |
| John Mayer vs Ed Sheeran      | 441   | poll / engagement                           |
| 850 followers milestone       | 894   | community                                   |
| "Help me find this song"      | 612   | crowd-sourced song ID (unidentified melody) |
| Channel intro                 | 231   | oldest post                                 |

## What the numbers say (feeds use #4 above)

- **Artist concentration**: Beatles ×4 (Come Together, Yellow Submarine, Blackbird, Norwegian
  Wood), Pink Floyd ×2 (both *Wish You Were Here*), everyone else ×1.
- **Era**: 60s–90s classic rock dominates; a smaller 2000s acoustic-alt pocket (Incubus, 3 Doors
  Down, John Mayer, Jack Johnson, Coldplay, Empire of the Sun) sits in the long tail.
- **Reach**: median cover ≈ 800 views. The two pinned covers (7330, 3353) run ~4–9× median —
  Bon Jovi and Pink Floyd are the proven draws. The single best post overall is **not** a cover
  but the "electric or acoustic?" gear poll (4299); the *artist* poll (Mayer vs Sheeran) only did
  441, so the gear question landed ~10× the artist one — format alone doesn't explain it.
- **Repeat signal**: the only repeated song, *Wish You Were Here*, overperformed both times
  (7330 and 1452) — re-cutting a proven song with a fresh hook works. → priority-bucket input.

## Derived hashtag sets

Observed across the channel; the base set recurs on nearly every cover.

- **`acoustic-cover-base`** (seed default): `#acousticguitar #guitarcover #guitartok` — near-universal.
- **Per-post extras**: artist + song tags, e.g. `#pinkfloyd #wishyouwerehere`, `#beatles
  #cometogether`, `#johnmayer #daughters`. These populate `content_posts.hashtag` extras, not the
  reusable set.

## Machine-readable seed (for a `scripts/database/seeding/dev/` loader)

A backfill loader can consume this directly; `postedOrder` is newest-first, `views` is the
2026-07-19 snapshot, `pinned` marks the two profile-pinned posts.

```json
{
  "channel": { "handle": "justmeandguitars", "followers": 845, "likes": 2095, "capturedAt": "2026-07-19" },
  "hashtagSets": [
    { "name": "acoustic-cover-base", "tags": ["acousticguitar", "guitarcover", "guitartok"] }
  ],
  "covers": [
    { "postedOrder": 1, "title": "Wanted Dead or Alive", "artist": "Bon Jovi", "views": 3353, "pinned": true, "electric": false, "videoId": "7630522092055842070" },
    { "postedOrder": 2, "title": "Wish You Were Here", "artist": "Pink Floyd", "views": 7330, "pinned": true, "electric": false, "videoId": "7629779374874643734" },
    { "postedOrder": 3, "title": "Sparks", "artist": "Coldplay", "views": 1012 },
    { "postedOrder": 4, "title": "Come Together", "artist": "The Beatles", "views": 1064 },
    { "postedOrder": 5, "title": "We Are the People", "artist": "Empire of the Sun", "views": 1281 },
    { "postedOrder": 6, "title": "One", "artist": "Metallica", "views": 504 },
    { "postedOrder": 7, "title": "I'll Be There for You", "artist": "The Rembrandts", "views": 591 },
    { "postedOrder": 8, "title": "Play That Funky Music", "artist": "Wild Cherry", "views": 1076, "electric": true },
    { "postedOrder": 9, "title": "Hallelujah", "artist": "Leonard Cohen", "views": 604 },
    { "postedOrder": 10, "title": "Wish You Were Here", "artist": "Pink Floyd", "views": 1452 },
    { "postedOrder": 11, "title": "Banana Pancakes", "artist": "Jack Johnson", "views": 705 },
    { "postedOrder": 12, "title": "Enjoy the Silence", "artist": "Depeche Mode", "views": 334 },
    { "postedOrder": 13, "title": "Wake Me Up When September Ends", "artist": "Green Day", "views": 1165 },
    { "postedOrder": 14, "title": "Daughters", "artist": "John Mayer", "views": 996 },
    { "postedOrder": 15, "title": "Yellow Submarine", "artist": "The Beatles", "views": 1251 },
    { "postedOrder": 16, "title": "Behind Blue Eyes", "artist": "The Who", "views": 738 },
    { "postedOrder": 17, "title": "Stairway to Heaven", "artist": "Led Zeppelin", "views": 715 },
    { "postedOrder": 18, "title": "Wonderwall", "artist": "Oasis", "views": 1689 },
    { "postedOrder": 19, "title": "Blackbird", "artist": "The Beatles", "views": 458 },
    { "postedOrder": 20, "title": "Hurt", "artist": "Johnny Cash", "views": 393 },
    { "postedOrder": 21, "title": "Dust in the Wind", "artist": "Kansas", "views": 848 },
    { "postedOrder": 22, "title": "Here Without You", "artist": "3 Doors Down", "views": 847 },
    { "postedOrder": 23, "title": "Drive", "artist": "Incubus", "views": 273 },
    { "postedOrder": 24, "title": "Norwegian Wood", "artist": "The Beatles", "views": 562 }
  ],
  "nonSongPosts": [
    { "label": "Electric or acoustic guitar?", "views": 4299, "type": "poll" },
    { "label": "John Mayer vs Ed Sheeran", "views": 441, "type": "poll" },
    { "label": "850 followers milestone", "views": 894, "type": "community" },
    { "label": "Help me find this song", "views": 612, "type": "song-id" },
    { "label": "Channel intro", "views": 231, "type": "intro" }
  ]
}
```

## References

- Consumes → [09-content-production.md](../09-content-production.md) (schema: `content_posts`,
  `content_post_metrics`, `song_videos`, `hashtag_sets`; gap **CNT-4**)
- Feeds → [03-songs-repertoire.md](../03-songs-repertoire.md) (`songs` catalog seed;
  `priority_bucket` / `recording_queued_at` content-pipeline columns)
- Related project (the channel's production side): vault
  `~/Obsidian/MainCV-Planner/projects/Private/justmeandguitars.md` (planning + overlay-app, stalled)
