---
created: 2026-07-20
updated: 2026-07-20
---

# SaaS Hygiene Benchmark — vs. Razikus/supabase-nextjs-template

Benchmark of Strummy against a generic Supabase + Next.js **SaaS starter template**
([Razikus/supabase-nextjs-template](https://github.com/Razikus/supabase-nextjs-template)),
captured 2026-07-20. Purpose: surface the small set of **SaaS table-stakes** the template
bundles by default that Strummy skipped while building domain features — and record each as an
agent-executable brief (`HYG-*`) so it can be picked up later.

**Framing (important):** the two are at different lifecycle stages. The template is a day-0
boilerplate; Strummy is a v0.160.0 production app (~20–30 DAU) that dwarfs it on testing,
observability, AI, calendar/Spotify integrations, exports, and domain depth. This doc is **not**
a "should we adopt the template" question (we shouldn't — that's a regression). It's a checklist
of hygiene the template happens to ship that we don't.

## Side-by-side

| Dimension       | Razikus template                                 | Strummy                                                                      |
| --------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| Type            | Generic SaaS boilerplate                         | Domain product (guitar-teacher CRM), in production                           |
| Maturity        | Day-0 starter                                    | v0.160.0, ~20–30 DAU                                                         |
| Next.js         | 15                                               | 16                                                                           |
| Structure       | Monorepo: `nextjs/` + `supabase/` + Expo mobile  | Single app · 124 API routes · 18 migrations                                  |
| Auth hardening  | Email/pw + reset, **MFA/2FA**, OAuth-ready       | OAuth + rate-limit + lockout + disposable-email + shadow email; **no MFA**   |
| Legal / consent | Privacy/Terms/Refund pages + GDPR cookie consent | **None in-app** (no `/privacy`, `/terms`, no consent banner)                 |
| i18n            | EN / PL / zh-CN                                  | **None** (`user_settings.language` was collected, never honored — see IDA-1) |
| File storage UX | Generic drag-drop upload + sharing module        | Avatars only (`lib/storage/avatar.ts`)                                       |
| Mobile          | Expo (React Native) companion on same backend    | Web only                                                                     |
| Payments        | Not in free tier (paid premium)                  | N/A (not a paid-billing product)                                             |

## Where Strummy already exceeds the template

Testing (Jest unit + integration + **RLS-specific** config, Playwright across iPhone/iPad/
desktop), Sentry + PostHog observability, an AI layer (OpenRouter/Ollama abstraction with
tools/agents), Google Calendar two-way sync, Spotify enrichment, transactional email
(nodemailer), PDF/Excel export, charts (nivo + recharts), a music-theory engine, cron
infrastructure, seed factories, and an agent/skill toolchain. None of that exists in the
template. Do not restructure anything around the template.

## Borrow candidates (agent-executable briefs)

Priority order for the portfolio/product goal: **HYG-1 (MFA) → HYG-2 (legal/consent) →
HYG-3 (i18n)**; HYG-4 and HYG-5 are parked. HYG-1/HYG-2 are identity-domain in nature — when
picked up, they can be renumbered into [01-identity-access.md](../01-identity-access.md) as the
next `IDA-*` IDs; they live here for now so the benchmark reads as one unit.

### HYG-1 — MFA (TOTP 2FA) enrollment

**Missing**: no `supabase.auth.mfa.*` usage anywhere. Auth is otherwise well-hardened
(rate-limit, account lockout, disposable-email blocking, shadow email) but there is **no second
factor**. For a product holding student PII this is the one real security gap. **Approach**: add
a Security card in settings that enrolls TOTP (`mfa.enroll({ factorType: 'totp' })` → render the
returned QR/secret → `mfa.challenge` + `mfa.verify` to activate), lists enrolled factors, and
supports unenroll. On sign-in, after the password step, check
`mfa.getAuthenticatorAssuranceLevel()`; if `aal1` with a verified factor, prompt for the 6-digit
code and call `mfa.verify` to reach `aal2`. Enable TOTP in Supabase Auth settings
(`supabase/config.toml` + dashboard). Consider requiring `aal2` for admin. **Files**:
`components/settings/editorial/SettingsEditorial.tsx` (Security card), new `lib/auth/mfa.ts`
helper, `components/auth/SignInForm.tsx` + `app/(auth)/sign-in/page.tsx` (challenge step),
`supabase/config.toml`. **Accept**: enrolling shows a QR; verifying a valid code activates the
factor; the next sign-in requires the code; a wrong code is rejected with a visible error;
unenroll removes the factor; admin sign-in can be forced to `aal2`.

### HYG-2 — Legal pages + GDPR cookie consent

**Missing**: no `/privacy`, `/terms`, or `/refund` routes exist in `app/`, and there is no
cookie-consent banner. PostHog currently initializes unconditionally. For an EU-operated SaaS
with real student data this is a compliance hole independent of the template. **Approach**: add
static legal routes (`app/privacy/page.tsx`, `app/terms/page.tsx`; refund optional — no payments
yet); a lightweight `<CookieConsent>` banner persisting the choice to `localStorage` and gating
analytics init until consent (defer PostHog init until accept). Link both from the site footer.
**Files**: new `app/privacy/page.tsx`, `app/terms/page.tsx`, new
`components/legal/CookieConsent.tsx`, footer in `components/landing/` or `components/layout/`,
PostHog init in `components/providers/`. **Accept**: `/privacy` and `/terms` render; the banner
appears on first visit and its dismissal persists; declining blocks analytics init (no PostHog
network calls until accept); footer links resolve.

### HYG-3 — i18n (Polish locale pilot)

**Missing**: no `next-intl`/translation layer; all UI strings are hardcoded English. IDA-1
already notes "language has no i18n." Poland-based operation gives a PL locale real product value
(and a defensible portfolio skill). **Approach**: adopt `next-intl` on the App Router
(cookie-based locale or a `[locale]` segment); extract strings into message catalogs
(`messages/en.json`, `messages/pl.json`); wrap the root layout in the provider. Scope the pilot
to high-traffic surfaces first (auth, dashboard nav, settings) rather than full coverage —
full extraction is a large mechanical effort, so keep it incremental. **Files**: `next.config.ts`
(plugin), new `messages/`, `app/layout.tsx` (provider), incremental component edits. **Accept**:
switching locale to `pl` renders translated nav + auth strings; missing keys fall back to EN; no
hydration mismatch. **Note**: lower priority — defer unless a PL-speaking user or portfolio
milestone forces it.

### HYG-4 — Generic file-storage UX (parked)

**Missing**: Storage is used only for avatars (`lib/storage/avatar.ts`); there is no reusable
upload/attach UX (e.g. lesson materials, handouts). **Approach**: generalize the avatar helper
into `lib/storage/upload.ts` and a `<FileDropzone>` (size/type limits, progress); add a
`lesson-materials` bucket with an owner-write / teacher-read policy; attach to lessons or
assignments. **Defer** until a concrete need (lesson attachments) is prioritized. **Files**: new
`lib/storage/upload.ts`, `components/shared/FileDropzone.tsx`, storage-policy migration under
`supabase/migrations/`. **Accept**: a teacher uploads a PDF to a lesson; the assigned student can
read it; oversize/wrong-type is rejected; RLS prevents cross-teacher read.

### HYG-5 — Native mobile companion (backlog / aspirational)

**Missing**: web only. The template ships an Expo (React Native) app sharing the same Supabase
backend — proof that Strummy's backend (Supabase + RLS + `gcrm_` API keys +
`database.types.ts`) could feed a native client. **Approach**: (not scoped now) an Expo
student-facing companion for practice logging, reusing the existing API and types. Recorded here
as evidence the backend is client-agnostic, not as near-term work. **Accept**: n/a (backlog).

## References

- Template: <https://github.com/Razikus/supabase-nextjs-template>
- Identity gaps: [01-identity-access.md](../01-identity-access.md) (`IDA-*`)
- Ordered plan: [90-roadmap.md](../90-roadmap.md)
- Env/deploy gates: [PRODUCTION_REQUIREMENTS.md](PRODUCTION_REQUIREMENTS.md)
