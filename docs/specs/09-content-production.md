---
created: 2026-06-16
updated: 2026-06-16
feature: Content / Production (tab-only)
phase: 2
status: superseded
---

> **Superseded (2026-07-18)** by docs/app-blueprint/09-content-production.md.

# Spec 09 — Content / Production (tab-only)

> Part of the [MASTER_SPEC](../MASTER_SPEC.md). Domain: [CONTEXT.md](../../CONTEXT.md). Depends on [Phase 0](./00-phase-0-restore-truth.md) §0.1 (bucket B tables restored).

## Goal (scope: tab works, no standalone module)

A song's **ProductionTab** lets the owner manage that song's recordings, content posts, and per-post metrics — backed by live tables (no silent failure). There is **no** top-level content module: the standalone `/dashboard/content/*` placeholders are removed from navigation. Ledger entry D-10.

## User stories

- As a teacher/admin on a song detail page, I open the **Production** tab and see the song's recordings and content posts.
- As that user, I create/edit/delete a content post (platform, status, `scheduled_at`, caption, hashtag set) and enter post metrics; changes persist and re-render without error.
- As any user, I never reach a "Coming soon" page from navigation — the standalone Content nav entry is gone.

## Current state (verified 2026-06-16)

| Question                     | Finding                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Does `ProductionTab` exist?  | Yes — `components/songs/production/ProductionTab.tsx`. Composes `RecordingList` + `PostList`. **Not mounted** anywhere (only self-references); no song-detail tab hosts it.                                                                                                                                                                                                          |
| Supporting components        | `PostList.tsx`, `PostFormDialog.tsx`, `PostMetricsForm.tsx`, `HashtagSetPicker.tsx`, `RecordingList.tsx`, `RecordingQualityForm.tsx`, hooks `useContentPosts.ts` / `useHashtagSets.ts` / `useUpdateRecording.ts`. Types + Zod exist (`types/ContentPost.ts`, `schemas/ContentPostSchema.ts`, `schemas/HashtagSetSchema.ts`).                                                         |
| Are content tables called?   | Yes, via REST handlers: `app/api/content/posts/handlers.ts` (`content_posts`), `.../posts/[id]/metrics/handlers.ts` (`content_post_metrics`), `.../hashtag-sets/handlers.ts` (`hashtag_sets`), `.../calendar/route.ts`. Hooks fetch these routes. **These tables are in bucket B (missing-from-prod), restored in Phase 0.1.**                                                       |
| Standalone pages             | `app/dashboard/content/page.tsx`, `.../calendar/page.tsx`, `.../hashtags/page.tsx` — all render a literal "Coming soon" card.                                                                                                                                                                                                                                                        |
| Where are nav links defined? | **Single** entry: `components/navigation/AppSidebar.tsx` lines 93–98 — `{ id: 'content', label: 'Content', icon: Clapperboard, path: '/dashboard/content/calendar' }` in the `tools` group. No content entry in `HorizontalNav.tsx`, `MobileBottomNav.tsx`, `MobileMoreMenu.tsx`, `RoleBasedNav.tsx`, or `menuConfig.ts` (verified — those files don't consume AppSidebar's config). |

## Implementation — current state (verified 2026-06-16)

**ProductionTab** — `components/songs/production/ProductionTab.tsx` (41 LOC, `'use client'`). Renders two cards: a **Recordings** card (`<RecordingList songId>`) and a **Content posts** card (`<PostList songId>`). Takes a single `songId` prop. Reads/writes (via child hooks → `/api/content/*` handlers): `content_posts`, `content_post_metrics`, `hashtag_sets` — all **bucket-B tables (missing-from-prod)**, restored only in Phase 0.1. **Mounted: nowhere.** A whole-repo search for `ProductionTab` returns zero references outside its own directory.

**Is it reachable today? No.** The song detail route `app/dashboard/songs/[id]/page.tsx` renders `SongDetailEditorial` (`components/songs/editorial/SongDetailEditorial.tsx`), which has **no tab set and no Production reference**. There is **no v2 `SongDetailPage`** — `components/v2/songs/` contains only `SongList*` components, not a detail page. So ProductionTab is mounted on neither the editorial detail nor any v2 detail; it is dead code, unreachable from any UI path.

**Standalone content pages** — `app/dashboard/content/{page,calendar/page,hashtags/page}.tsx` each render a single `<CardTitle>Coming soon</CardTitle>` card. They are reachable only via the one nav entry.

**Nav entry to delete** — `components/navigation/AppSidebar.tsx` **lines 93–98** (`tools` group object `{ id: 'content', label: 'Content', icon: Clapperboard, path: '/dashboard/content/calendar' }`). The `Clapperboard` import is at **line 21** (drop it if unused after removal — note `ProductionTab.tsx` also imports `Clapperboard`, but that is a separate module). No other nav file references the content route.

**v2 content components** — none. The only `*Content*` files under `components/v2/` are unrelated `Parent.Content.tsx` sub-components (repertoire, song-of-the-week, users, dashboard widgets).

| Component / Route                         | Renders                                  | Tables                                                             | State                                 |
| ----------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------ | ------------------------------------- |
| `ProductionTab.tsx`                       | Recordings card + Content posts card     | `content_posts`, `content_post_metrics`, `hashtag_sets` (bucket B) | Built, **unmounted**, unreachable     |
| `app/dashboard/songs/[id]/page.tsx`       | `SongDetailEditorial` (no tabs)          | songs / stats / learners                                           | Live; does **not** host ProductionTab |
| `app/dashboard/content/page.tsx`          | "Coming soon" card                       | —                                                                  | Placeholder                           |
| `app/dashboard/content/calendar/page.tsx` | "Coming soon" card                       | —                                                                  | Placeholder (nav target)              |
| `app/dashboard/content/hashtags/page.tsx` | "Coming soon" card                       | —                                                                  | Placeholder                           |
| `AppSidebar.tsx` L93–98 (`content`)       | nav link → `/dashboard/content/calendar` | —                                                                  | Live; **to remove**                   |

**What's built:** ProductionTab and its full supporting tree (`PostList`, `PostFormDialog`, `PostMetricsForm`, `HashtagSetPicker`, `RecordingList`, `RecordingQualityForm`, hooks, `/api/content/*` handlers, Zod schemas, types) all exist and are wired to the content tables.

**What's missing or to-remove:** (1) ProductionTab is mounted **nowhere** — no host tab on the editorial song detail. (2) The `content` nav entry (AppSidebar L93–98) still surfaces a "Coming soon" placeholder — must be deleted. (3) The three `/dashboard/content/*` placeholder pages remain (delete preferred; minimum: unreachable from nav).

**Gap to this spec's target behavior:** Reaching DoD requires three things — (a) mount `<ProductionTab songId>` as a teacher/admin-only tab inside `SongDetailEditorial` (which currently has no tab scaffolding at all, so a tab container must be introduced); (b) remove the AppSidebar `content` entry (L93–98) and prune `/dashboard/content/*`; (c) the entire data path is **blocked on Phase 0.1** — until the bucket-B tables are restored to prod, every `/api/content/*` call 500s, so the tab must not be mounted before then.

## Data contract (ProductionTab reads/writes)

Queries go through `/api/content/*` handlers using the request's RLS-scoped Supabase client (`supabase.from('content_posts')` etc.). RLS is the boundary (ADR-0001); handlers do not re-filter ownership.

| Operation         | Route / hook                                                  | Table                  | Payload                                     |
| ----------------- | ------------------------------------------------------------- | ---------------------- | ------------------------------------------- |
| List posts        | `GET /api/content/posts?song_id=` → `useContentPosts(songId)` | `content_posts`        | `{ posts: ContentPost[] }`                  |
| Create post       | `POST /api/content/posts`                                     | `content_posts`        | `CreateContentPostInput` → `{ post }`       |
| Update post       | `PATCH /api/content/posts/[id]`                               | `content_posts`        | `UpdateContentPostInput` → `{ post }`       |
| Delete post       | `DELETE /api/content/posts/[id]`                              | `content_posts`        | `204`                                       |
| Save metrics      | `POST /api/content/posts/[id]/metrics`                        | `content_post_metrics` | `CreateContentPostMetricInput` → `{ post }` |
| Hashtag sets CRUD | `/api/content/hashtag-sets[/id]` → `useHashtagSets`           | `hashtag_sets`         | `{ hashtagSets }` / `{ hashtagSet }`        |

**RLS:** `content_posts`, `content_post_metrics`, `hashtag_sets` scope to the owning teacher/admin (song owner). Students have no access. Tab is teacher/admin-only — it is not in the student song surface.

## Behavior & edge cases / failure modes

- **Pre-Phase-0 (tables missing):** handlers return `{ error, status: 500 }`; hooks `throw` and surface a toast (no swallow) — but the tab is dead. Spec is **blocked on §0.1**; do not mount before tables are restored.
- **Post-restore:** empty result sets render empty-state lists, not errors.
- **Nav must not surface Coming-soon:** the `content` AppSidebar entry resolves to `/dashboard/content/calendar`, a "Coming soon" card — this violates exit-criterion 1. Remove the entry.
- **Status transitions** are validated server-side (`canTransitionPostStatus`, `lib/content/post-status.ts`); illegal transitions return 4xx and toast.

## Files to touch

| File                                                                                     | Change                                                                                                                 |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `components/songs/production/ProductionTab.tsx`                                          | Mount into the song-detail editorial tab set (currently unmounted).                                                    |
| song-detail editorial host (`components/songs/editorial/*` / `app/dashboard/songs/[id]`) | Add a "Production" tab that renders `<ProductionTab songId={...} />` for teacher/admin only.                           |
| `components/navigation/AppSidebar.tsx`                                                   | **Remove** the `tools` entry `id: 'content'` (lines 93–98). Drop the now-unused `Clapperboard` import if no other use. |
| `app/dashboard/content/*`                                                                | Route files may stay or be deleted; they must be **unreachable from nav**. Deleting is cleaner.                        |

## Acceptance criteria (as test names)

- `production-tab.test` — song ProductionTab reads/writes `content_posts` (and metrics) without error against restored tables; create → list → edit → delete round-trip.
- `production-tab.rls.test` — owning teacher/admin sees own song's posts; a non-owner / student is denied (no rows).
- `nav.no-coming-soon.test` — no nav link (sidebar, horizontal, mobile) resolves to a "Coming soon" placeholder; the `/dashboard/content/*` paths are absent from navigation config.

## Definition of Done (5-point)

1. **Behavior:** ProductionTab is mounted on song detail (teacher/admin) and the post + metrics + hashtag-set CRUD works end-to-end.
2. **No silent failure:** all `/api/content/*` calls hit live tables (Phase 0.1 done); errors toast, never swallow.
3. **RLS-tested:** `content_posts`, `content_post_metrics`, `hashtag_sets` have RLS tests (owner-only).
4. **Editorial:** the tab renders inside the editorial song-detail surface; no `ui-version` cookie branch.
5. **Nav clean:** the standalone Content entry is removed; `nav.no-coming-soon.test` passes.

## Dependencies & out of scope

- **Depends on:** Phase 0 §0.1 (bucket B tables `content_posts`, `hashtag_sets`, `content_post_metrics` restored to prod) and Spec 01 (Songs editorial detail page that hosts the tab).
- **Out of scope:** a standalone content module / content calendar / hashtag manager pages — explicitly NOT built (D-10). No separate v1/v2/v3 content trees exist to delete beyond mounting the tab in the editorial host.
