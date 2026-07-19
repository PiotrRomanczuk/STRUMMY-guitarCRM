---
created: 2026-06-19
updated: 2026-06-19
---

# Google Auth & Calendar — Development Across All Environments

Strummy's calendar (and Drive video) features all key off **one Google connection** per
teacher. This runbook covers how to get Google auth working in **every** environment
combination — local/remote site × local/remote Supabase — and how to develop the
calendar sync loop locally **without** Google webhooks (which need public HTTPS).

Related: [`../02-lessons-calendar.md`](../02-lessons-calendar.md) (calendar domain: behavior, gaps, sync details).

---

## 1. Two OAuth flows, one Google client

A single Google OAuth client (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`) backs **both**:

| Flow                   | Trigger                                                                   | Redirect target                                         | Result                                            |
| ---------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| **A — Login**          | `signInWithOAuth({ provider: 'google' })` (`app/(auth)/sign-in/page.tsx`) | **Supabase** `/auth/v1/callback` → app `/auth/callback` | Auth session (login)                              |
| **B — Calendar/Drive** | `/api/auth/google` → Google → `/api/oauth2/callback`                      | **App** `/api/oauth2/callback` (origin auto-derived)    | Tokens in `user_integrations` (provider `google`) |

- Flow A's redirect goes to **Supabase**, so the registered URI depends on _which Supabase_ you use.
- Flow B builds its redirect from `request.nextUrl.origin` (`app/api/auth/google/route.ts`), so it
  adapts to any site automatically — you only need each origin's `/api/oauth2/callback` registered.
- Scopes (Flow B): `calendar`, `userinfo.email`, `drive.file` (`lib/google.ts`).

---

## 2. Google Cloud Console — redirect URIs to register (once)

On the OAuth client (APIs & Services → Credentials → your **Web** client), add **all** of these
under _Authorized redirect URIs_:

**Login (Supabase callbacks):**

```
http://127.0.0.1:54321/auth/v1/callback                 # local Supabase
https://zmlluqqqwrfhygvpfqka.supabase.co/auth/v1/callback # remote Supabase (project ref)
```

**Calendar/Drive (app callbacks):**

```
http://localhost:3000/api/oauth2/callback
http://127.0.0.1:3000/api/oauth2/callback
https://strummy-preview.vercel.app/api/oauth2/callback
https://strummy.app/api/oauth2/callback
```

The OAuth **consent screen** must list the three scopes above. While in _Testing_ mode, add
`p.romanczuk@gmail.com` (and any other dev account) as a **Test user**, or consent will be blocked.

---

## 3. Supabase configuration per environment

**Local Supabase** — `supabase/config.toml`:

- `[auth.external.google]` is `enabled` and reads `env(GOOGLE_CLIENT_ID/SECRET)`.
- `additional_redirect_urls` must include the app's `/auth/callback` for whichever host you use —
  both `localhost:3000/auth/callback` and `127.0.0.1:3000/auth/callback` are listed.
- `supabase start` picks these up. Changing them requires `supabase stop && supabase start`.

**Remote Supabase** — Dashboard → Authentication:

- _Providers → Google_: set Client ID/Secret (same OAuth client).
- _URL Configuration → Redirect URLs_: add the site origins that will use remote Supabase —
  at minimum `http://localhost:3000/**` (for the local-site + remote-Supabase combo) and the
  Vercel/prod URLs.

---

## 4. The 4 combinations (site × Supabase)

Which Supabase the app uses is decided by `lib/supabase/config.ts`: **local is auto-selected** when
`NEXT_PUBLIC_SUPABASE_LOCAL_URL` + `..._LOCAL_ANON_KEY` are set and reachable; otherwise remote.
`next.config.ts` probes the local port at build and falls back to remote if unreachable. A
`sb-provider-preference=remote` cookie (set via the `DatabaseStatus` toggle) forces remote even when
local is available.

| #   | Site                | Supabase        | How to select                          | Connect (Flow B)   | Tokens land in             | Inbound sync                                                    |
| --- | ------------------- | --------------- | -------------------------------------- | ------------------ | -------------------------- | --------------------------------------------------------------- |
| 1   | `localhost:3000`    | **local** (uwh) | default `.env.local`                   | `/api/auth/google` | LOCAL `user_integrations`  | `npm run dev:calendar-sync` or in-app **Sync now** — no webhook |
| 2   | `localhost:3000`    | **remote**      | `sb-provider-preference=remote` cookie | `/api/auth/google` | REMOTE `user_integrations` | `npm run dev:calendar-sync -- --remote` or **Sync now**         |
| 3   | Vercel preview/prod | **remote**      | default on Vercel                      | `/api/auth/google` | REMOTE                     | webhook (HTTPS) + `renew-webhooks` cron + dispatcher polling    |
| 4   | Vercel              | **local**       | —                                      | **not supported**  | —                          | Vercel can't reach the LAN Supabase; use combos 1–3             |

> **Local-host gotcha (CLAUDE.md):** `.env.local` sets `NEXT_PUBLIC_SUPABASE_LOCAL_URL=http://192.168.1.75:54321`,
> but Node `fetch` on the Mac can hit `EHOSTUNREACH` on that LAN IP (Tailscale routing quirk). If a
> Node CLI fails to reach local Supabase, override at invocation with the Tailscale URL:
> `NEXT_PUBLIC_SUPABASE_LOCAL_URL=http://100.86.245.121:54321 npm run dev:calendar-sync`.

---

## 5. Connecting & disconnecting

- **Connect**: Settings → _Integrations_ → **Connect Google Calendar** (or hit `/api/auth/google`
  directly). Tokens are upserted into the **currently-selected** Supabase's `user_integrations`.
- **Disconnect**: same card → **Disconnect** (`disconnectGoogle` in `app/dashboard/calendar-actions.ts`)
  stops any webhook watches and deletes the token + subscription rows.
- The Integrations card is teacher/admin-only.

---

## 6. Inbound sync locally — no webhooks

Google push webhooks require a public HTTPS endpoint, so they never fire against `localhost`
(`app/actions/calendar-webhook.ts` rejects non-tunnelled localhost). Two webhook-free ways to run the
same import the webhook would (`fetchAndSyncRecentEvents`, 7d back / 30d forward, filters events whose
description contains `Powered by Calendly.com` **and** that have attendees):

- **CLI** (admin, no browser): `npm run dev:calendar-sync [-- you@example.com] [--remote]`
  (`scripts/development/calendar-sync.ts`). Targets local Supabase by default.
- **In-app SSE**: the authenticated `GET /api/calendar-sync` route (used by a **Sync now** button)
  streams progress and refreshes the token inline.

To test webhooks end-to-end, run an `ngrok http 3000` tunnel, set `NEXT_PUBLIC_APP_URL` to the HTTPS
tunnel URL, then enable the webhook from the UI. Not needed for normal local dev.

---

## 7. Develop with the Google MCP server (seed → sync → verify)

The Claude session's **Google Calendar MCP** is connected to `p.romanczuk@gmail.com` — the same
account that holds the live integration. Use it to drive the real calendar as a test harness, so you
never hand-edit events in the Google UI. Full round-trip:

1. **Seed** — `mcp__claude_ai_Google_Calendar__create_event`: 2–3 events with
   - a **description containing `Powered by Calendly.com`** (the `isGuitarLesson` marker), and
   - an **attendee** whose email is an existing student (else a shadow student is created on import).
2. **Connect** — dev server on `localhost:3000` + local Supabase → `/api/auth/google` → approve
   consent (manual click). Tokens land in LOCAL `user_integrations`.
3. **Sync** — `npm run dev:calendar-sync` → imports the seeded events as lessons.
4. **Verify** — query LOCAL `lessons` for the new `google_event_id`s; confirm via
   `mcp__claude_ai_Google_Calendar__list_events`. For **outbound**, create a lesson in the app and
   confirm a matching Google event appears via `list_events`.
5. **Cleanup** — `mcp__claude_ai_Google_Calendar__delete_event` for each seeded event; remove the
   test lessons from the DB.

---

## 8. Environment variable checklist

| Var                                                                                         | Where                          | Notes                                                |
| ------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`                                                 | `.env.local`, Vercel, Supabase | One client, both flows                               |
| `GOOGLE_REDIRECT_URI`                                                                       | `.env.local`, Vercel           | Fallback only; Flows A/B derive redirect from origin |
| `NEXT_PUBLIC_SUPABASE_LOCAL_URL` / `..._LOCAL_ANON_KEY` / `SUPABASE_LOCAL_SERVICE_ROLE_KEY` | `.env.local`                   | Presence + reachability ⇒ local is auto-selected     |
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`                   | `.env.local`, Vercel           | Remote fallback                                      |
| `NEXT_PUBLIC_APP_URL`                                                                       | Vercel (HTTPS)                 | Required for webhook registration                    |
| `GOOGLE_CALENDAR_WEBHOOK_SECRET`                                                            | Vercel                         | Validates inbound webhook calls                      |

---

## 9. Known gaps (not blockers for dev)

- **User-session token refresh** — `getGoogleClient` (`lib/google.ts`) does _not_ refresh expired
  tokens, unlike `getGoogleClientAdmin` and the `/api/calendar-sync` route. Outbound lesson→Google
  sync can fail on an expired token until reconnected. Spec gap 7.5.
- **Webhook dev-skip** — the webhook handler bypasses token validation when `NODE_ENV=development`
  (spec gap 7.7).
- **Calendar page** (`/dashboard/calendar`) is a "Coming soon" stub (spec gap 7.1).
