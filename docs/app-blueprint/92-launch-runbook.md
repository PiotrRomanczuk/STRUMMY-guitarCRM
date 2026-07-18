---
created: 2026-07-18
updated: 2026-07-18
---

# Self-Host Launch Runbook

Procedure for cutting production over from the dev-conflated `StudentManager` stack to the clean
dedicated `StrummyProd` stack on uwh, then onboarding the first 5 real students. This doc owns
the **procedure and gates**; live status of each step is tracked in the vault
(`projects/Strummy/Strummy.md`, "v1 Self-Host Launch Plan") — check there before executing
anything, several steps may already be done.

Topology and the P0–P2 history (baseline capture, stack stand-up, song-library seed) are
summarized in [00-overview.md](00-overview.md#production-topology-2026-07-18); this runbook
covers the remaining phases P3–P5.

## 🔴 Hard gates before student #1

All of these, no exceptions:

1. Backup restore proven (NAS + encrypted R2 offsite — both restore-tested)
2. Pull-the-plug recovery proven (hard power cut → stack self-heals via systemd)
3. Schema parity: `pg_dump --schema-only` of StrummyProd vs baseline diffs empty
   (modulo documented drift, [00-overview.md](00-overview.md#schema-truth))
4. Song library present (447 songs, content fidelity verified)
5. All 5 students onboarded and able to log in
6. Invite email lands in a **non-Gmail** inbox
7. Both login paths (password + Google) reach a dashboard
8. RLS cross-read test green **against StrummyProd** (not dev — see
   [91-testing-strategy.md](91-testing-strategy.md#rls-testing))
9. Practice triggers fixed (PRA-1, [04-practice-progress.md](04-practice-progress.md)) —
   undo of a song-linked session must not error, aggregates must accrue (promoted to hard
   gate in grill 2026-07-18: practice logging is the one student write surface in the core
   loop; shipping it broken violates the trust pass)

## P3 — Harden self-host (remaining items)

Done already (per vault, restore-proven): systemd auto-start unit, nightly NAS backup + timer,
encrypted R2 offsite. Remaining:

### P3.1 UPS

- UPS on both the EliteDesk and the router. After install: pull-the-plug test — cut wall power,
  confirm the box rides it out; then a full outage test (drain) — confirm clean shutdown and
  auto-recovery on power return (gate 2).

### P3.2 External uptime monitor

- External SaaS monitor (UptimeRobot / Better Stack — decision from 2026-06-22 grill) on:
  the Vercel app URL **and** the DB tunnel endpoint (`strummy-db.marszal-arts.online` health).
- Phone push on failure. Keep internal Kuma/Beszel as secondary.

### ⚠️ Known trap

Do **not** run `~/strummy-prod/recreate-auth-test.sh` — it creates a non-CLI auth container that
collides with `supabase start/stop` and breaks stack boot. Real SMTP/URL config happens via
`config.toml` at P4 so the CLI owns the container.

## P4 — Cutover

1. **Freeze**: announce/observe a quiet window; take a manual backup of both StudentManager and
   StrummyProd (`pg_dump -Fc` as `supabase_admin`).
2. **Configure StrummyProd auth properly** via `config.toml` (Gmail SMTP, site/redirect URLs,
   Google provider on) so the CLI owns the auth container; restart stack.
3. **Google OAuth**: consent screen → Production, login-only scopes; redirect URIs → StrummyProd
   GoTrue (tunnel URL).
4. **Repoint Vercel**: swap the prod env vars (Supabase URL/keys: Cloud/StudentManager →
   StrummyProd tunnel). Redeploy `production`.
5. **Smoke test** (manual, ~15 min): password login, Google login, teacher dashboard, student
   dashboard, create+edit a lesson, assign a song, log practice, invite flow to a throwaway
   address.
6. **Run the RLS cross-role suite against StrummyProd** (gate 8).
7. **Rollback path**: previous env vars kept; StudentManager left running untouched. Rollback =
   re-swap env vars + redeploy. Keep Cloud as second-line rollback.

## P5 — App-level launch gates

Done already (per vault): student scope-hide (placeholder cards + voice stub removed), RLS
cross-read test built (green vs dev), auth-flow fixes (names persistence, onboarding gate,
error recovery). Remaining:

1. **Dry-run**: full student lifecycle as a throwaway — invite email (to a non-Gmail inbox,
   gate 6) → accept → set password → log in both paths → see repertoire → log practice → delete.
2. **Invite the 5 real students** (needs: names + emails). Assign repertoire live in the first
   lesson — no pre-seeding.
3. **Post-cutover checks** (first week): Sentry events actually arriving from prod; invite/email
   deliverability; nightly backup artifacts appearing on NAS + R2; uptime monitor quiet.

## Open flags

- **Minors/GDPR**: if any of the 5 is a child — privacy policy + parental consent before
  collecting data (`is_parent` role exists but the parent surface is unbuilt).
- **Cloud's fate**: reconcile or retire the divergent Cloud project after cutover proves stable
  (tracked in [90-roadmap.md](90-roadmap.md)).
- **R2 token scope**: rotate the account-wide Admin token to a bucket-scoped Object-R/W token.

## References

- Vault `projects/Strummy/Strummy.md` — live status, decisions log (2026-06-22 grill)
- `supabase/baseline/README.md` — baseline load procedure
- Memories: `reference_songs_weekly_nas_backup`, `reference_local_supabase_start_uwh`
