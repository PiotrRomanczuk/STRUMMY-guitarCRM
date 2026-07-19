# 24-Hour Recruiter Demo Readiness Plan

**Date**: 2026-07-19
**Author**: Claude (with Piotr's decisions)
**Scope**: Make strummy.vercel.app recruiter-ready in 24h — rich data, every visible button working, one-click demo entry.

## Decisions (locked with Piotr)

1. **Format**: self-serve link — recruiter clicks around alone. Zero dead ends anywhere on the visible surface.
2. **Mutations**: demo accounts get **real write access** (guard bypass) + reseed as the reset mechanism.
3. **Scope**: core loop + curated extras (repertoire, practice, AI assist; fretboard time-permitting).

## Ground truth (verified 2026-07-19, not assumed)

- **strummy.vercel.app is UP** (200, 0.46s) and its bundle contains `strummy-db.marszal-arts.online` → **production runs against the StudentManager stack on uwh** (Cloudflare tunnel). Same DB that `.env.local` targets. Migrations reconciled there 2026-07-14 (175 recorded) — no schema work needed.
- **`main` deploys straight to production; previews are disabled** (`vercel.json ignoreCommand`, PR #520). The current branch never deploys. Every merge in the next 24h lands on the demo URL.
- **Demo infrastructure already exists**: 5 personas (`sarah@strummy.app` teacher + emma/carlos/lily/james students, password `Demo2024!`), `is_development` profile flag, dismissible DemoBanner, one-click entry **`/sign-in?demo=true`** (auto-fills + submits as Sarah), and an idempotent `scripts/database/seeding/demo/seed-demo.ts` (7 fully-fleshed songs, 31 completed lessons with narrative notes, 10 this-week lessons, lesson_songs status progressions, 14 assignments). Re-running it = reset.
- **Live data is wrong for a demo**: Sarah is mis-flagged `student` with 0 lessons; the 57 existing lessons are RLS-test debris owned by `rls-teacher-*@guitarcrm.local`; `lesson_songs` is empty; no active SOTW; 4 notifications; 429 songs in catalog.
- **Demo accounts are mutation-blocked at ~90 call sites** (`lib/auth/test-account-guard.ts`), mostly failing silently.
- **Prod env corruption is real**: `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` end in a literal 4-char `\r\n`; POSTHOG pair ends in literal `\n`. Email + Google OAuth code-flow likely broken in prod. (Vars pulled as empty — `NEXT_PUBLIC_SUPABASE_URL` etc. — are Vercel _sensitive_ vars, fine at runtime.)
- **PWA icons 404** (`public/icons/` doesn't exist) — install prompt never appears despite a correct manifest.
- **Landing/auth pages render a legacy debug header** (purple bar with a clickable "Remote DB" badge firing Supabase probes) on top of the marketing header; 11 footer/FAQ links 404; FAQ falsely claims students need no account; pricing tiers are fictional; "Watch demo" buttons just scroll.

---

## Phase 0 — Env repair & gates (~1h, do first)

- [ ] Re-set the 4 `\r\n`-corrupted Vercel prod vars (`vercel env rm` + `add`: GMAIL_USER, GMAIL_APP_PASSWORD, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) and the 2 `\n`-suffixed POSTHOG vars. Re-set `NEXT_PUBLIC_APP_URL=https://strummy.vercel.app` (sensitive-masked, can't verify — email links fall back to localhost if unset).
- [ ] Add safety to `seed-demo.ts` **before any run**: print resolved target URL + require typed confirmation (today it writes with service-role, no prompt, to whatever `.env.local` says).
- [ ] Smoke OpenRouter (`npm run test:ai:check`) — the prod key is 195 days old; AI unhide (Phase 4) depends on it.
- [ ] Verify avatar upload against StudentManager (stack likely has no storage-api). If broken → hide the upload button, keep the manual-URL fallback (`SettingsEditorial.AvatarUpload` has one).

## Phase 1 — Demo data: "plenty of data" (~2–3h)

- [ ] Fix Sarah's role flags (teacher) — verify `seed-demo.ts` upsert sets them; correct the live row either way.
- [ ] **Song-title collision check before seeding**: seed upserts songs by title against a 429-song live catalog (Wonderwall etc. may exist and belong to real data). Prefer insert-if-missing or rename demo variants.
- [ ] Extend `seed-demo.ts` with what it doesn't cover (these pages are otherwise empty):
  - `practice_sessions` — 4 weeks of history with a visible streak + BPM values for Emma/Carlos
  - `student_repertoire` — statuses, self-ratings, notes for all 4 students
  - in-app notifications — 8–12 rows across types for Sarah + Emma
  - active Song of the Week + teacher message
  - 2 song requests (1 pending, 1 approved)
  - optional: canned AI conversation (`lib/demo/demo-ai-conversation.ts` exists)
- [ ] Run seed against StudentManager (deliberate, confirmed). Verify: today's lessons on the day spine, week-density bars alive, lesson detail shows songs with statuses, assignments mix (overdue/due-soon/done).
- [ ] Verify the lesson-form student dropdown populates (teacher_students derives from seeded lessons).

## Phase 2 — Demo writes + reseed (~1.5h)

- [ ] Central switch: `guardTestAccountMutation`/`assertNotTestAccount` become no-ops when `DEMO_WRITES_ENABLED === 'true'` (one file covers ~90 call sites). Audit the few API routes that inline the check instead (`/api/drive/files` returns a bare `Forbidden`).
- [ ] Set `DEMO_WRITES_ENABLED=true` in Vercel production. Default stays off → local/E2E guard behavior unchanged (`demo-mutation-guards` suite stays green).
- [ ] DemoBanner copy → "Live demo — explore freely. Sample data resets daily."
- [ ] Add `npm run seed:demo` alias; document the reset ritual (reseed right before sharing the link). Stretch: daily scheduled reseed via GH Actions.

## Phase 3 — Kill visible embarrassments (~2.5h)

P0 (must):

- [ ] `components/layout/AppShell.tsx:47` — stop rendering the legacy Header/ConnectionStatus on `/` and auth routes (removes double header, public DB badge, its failure toasts). Also drop the `logger.info` at line 39 (console noise every navigation).
- [ ] Landing: point both "Watch demo" buttons (`Hero.tsx:58`, `FinalCTA.tsx:51`) at **`/sign-in?demo=true`**; fix/drop the 11 dead footer+FAQ links; replace placeholder social URLs with real GitHub/LinkedIn.
- [ ] Copy honesty: rewrite FAQ "students don't need an account"; retitle pricing to "Planned pricing" and trim untrue bullets (parent visibility, invoicing, attendance).
- [ ] Song detail: remove `ComingSoonCard` (roadmap card on every song); keep ProductionTab hidden.
- [ ] PWA: generate `public/icons/icon-192.png` + `icon-512.png` from the logo → "Install app" works (10 min, high wow-factor).

P1 (should): rewrite the 4 dev-note strings in `AdminDashboardEditorial.tsx` (121/125/177/181); fix the assignments empty-state instruction.

## Phase 4 — Curated unhides (~1.5h)

- [ ] `CORE_LOOP_HIDDEN_ITEMS`: remove `repertoire`; keep `my-stats` hidden (it points at the `/dashboard/stats` stub). Add a Practice nav item if none exists (page is live + E2E-covered).
- [ ] AI: remove `ai`/`ai-chat` from the hidden list; relax `/dashboard/ai` + `/dashboard/ai/history` guards admin→staff. Depends on Phase 0 OpenRouter smoke.
- [ ] Fretboard: unhide (self-contained, no data needed) — time-permitting.
- [ ] Per unhidden page: click-through with seeded data as both roles; anything rough gets re-hidden (10-min decision each). Delete dead `DEMO_HIDDEN_ITEMS` while in the file.

## Phase 5 — Ship & verify (~2h + buffer)

- [ ] Full local click-through against StudentManager, both roles: every nav item; create lesson w/ songs, edit song, create assignment (Sarah); log practice, self-rate repertoire, advance assignment (Emma); AI generate; notifications feed; settings.
- [ ] Quality gates: `npm run lint && npm run test:all`. Manual test report: `docs/manual-tests/2026-07-20-recruiter-demo-readiness.html`.
- [ ] Merge to `main` **early** (single PR; deploys straight to prod — leave ≥3h buffer). Escape hatch: `.github/workflows/deploy.yml` manual prebuilt deploy.
- [ ] Post-deploy live pass on strummy.vercel.app: `?demo=true` entry, full click-through, mobile spot-check at 390px on dashboard/lessons/songs (editorial grids are fixed-width — patch only if egregious).
- [ ] **Final reseed** right before sending the link. Keep a logged-in session open. Know the escape hatches: `resetFailedAttempts(email)` (5 bad passwords = 30-min lockout), `resetAuthRateLimit` (limiter fails closed on DB errors).

## Phase 6 — Presentation collateral (~1h)

- [ ] Recruiter one-pager/email: what Strummy is (production SaaS with real users, Next.js 16/React 19/Supabase/RLS/AI), demo link `https://strummy.vercel.app/sign-in?demo=true`, student view creds (emma@strummy.app / Demo2024!), 3 suggested flows (schedule a lesson with songs → student view → AI assist), GitHub link.
- [ ] CV/portfolio: use **strummy.vercel.app** everywhere — `strummy.app` is NXDOMAIN; don't gamble on 24h DNS.
- [ ] README: fix the false seeding instructions; add the demo link at the top (recruiters open READMEs).

## Risk register

| Risk                                              | Mitigation                                                                                                                               |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| No preview env — every merge is live              | Test locally against the same DB; merge once, early; manual-deploy escape hatch                                                          |
| Real users on the stack (~20–30 DAU)              | Guard bypass applies only to `is_development` accounts; seed touches only demo students' rows; song-title collision check before seeding |
| OpenRouter key stale (195d)                       | Smoke in Phase 0 before promising AI in the demo                                                                                         |
| Avatar upload broken (no storage-api on uwh)      | Verify in Phase 0; hide upload, keep URL fallback                                                                                        |
| Auth limiter fails closed / lockout at 5 attempts | Pre-login; keep reset helpers at hand                                                                                                    |
| Demo data goes stale at week rollover             | Reseed refreshes the this-week schedule; reseed right before sharing                                                                     |

## Timeline (≈10–11h hands-on)

- **Tonight (h0–h4)**: Phase 0 → Phase 1 → start Phase 3
- **Tomorrow AM**: Phase 2 + finish Phase 3 + Phase 4 + local verification
- **Tomorrow PM**: merge, deploy, live verification, reseed
- **Last 2h**: collateral + buffer
