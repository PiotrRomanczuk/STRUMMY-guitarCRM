---
created: 2026-06-16
updated: 2026-06-16
---

# Strummy — Architecture

> Living architecture reference for the guitar-crm (Strummy) student management system (~v0.143.0).
> The canonical plan lives in [`docs/app-blueprint/`](../README.md); the domain model lives in `CONTEXT.md`.

---

## Tech Stack

| Layer      | Technology                                                     |
| ---------- | -------------------------------------------------------------- |
| Frontend   | Next.js 16 (App Router), React 19, Tailwind CSS 4              |
| State      | TanStack Query (server state), React Context (UI state)        |
| Backend    | Supabase (PostgreSQL, Auth, Realtime, Storage), Server Actions |
| Validation | Zod (`/schemas`)                                               |
| Logging    | Pino — structured logging (see ADR-0003)                       |
| AI         | OpenRouter (cloud) + Ollama (local), via provider abstraction  |
| Testing    | Jest (unit + integration), Playwright (E2E)                    |
| Hosting    | Vercel — `main` → Preview, `production` → strummy.app          |

Server state uses TanStack Query throughout (custom hooks wrap `useQuery`), giving automatic caching, background refetch, request deduplication, and built-in loading/error states.

---

## Directory Structure

```
app/
├── (auth)/         # sign-in, sign-up
├── actions/        # Server Actions (incl. ai.ts)
├── ai/             # AI dev/test pages
├── api/            # Route Handlers (incl. /api/external, /api/database)
├── auth/           # auth callbacks
├── dashboard/      # protected routes: admin, assignments, lessons, songs, users, settings
└── onboarding/     # first-time setup

components/
├── ai/             # streaming status, error boundary
├── <domain>/       # assignments, auth, dashboard, lessons, songs, users, …
├── navigation/     # sidebar, breadcrumbs
└── ui/             # shadcn/ui

lib/
├── ai/             # provider abstraction, agents, rate limiter, streaming
├── api/            # database-router, unified-db
├── auth/           # rate-limiter
├── database/       # dual-DB connection routing
├── services/       # business logic
└── supabase/       # client utilities

schemas/            # Zod schemas
types/              # TypeScript types
hooks/              # cross-cutting hooks (useDatabaseStatus, useAIStream)
```

**Domain component layout** — each domain folder follows: `actions/`, `details/`, `form/`, `hooks/`, `list/`, `index.ts` (public API), optional `types/`.

---

## Role-Based Access Control

Three roles. **RLS is the security boundary** — every table has RLS enabled and policies enforce role-based access; application-level checks are convenience only, never the enforcement point (see ADR-0001).

| Role    | Access                                                       |
| ------- | ------------------------------------------------------------ |
| Admin   | Full system access, user management, configuration           |
| Teacher | Manage own students, CRUD lessons/songs/assignments for them |
| Student | Read-only: own lessons, assigned songs, own assignments      |

| Entity      | Admin | Teacher             | Student         |
| ----------- | ----- | ------------------- | --------------- |
| Users       | Full  | View students       | View self       |
| Lessons     | Full  | CRUD (own students) | Read (own)      |
| Songs       | Full  | CRUD (own students) | Read (assigned) |
| Assignments | Full  | CRUD (own students) | Read (own)      |

RLS policy shape: `SELECT` returns own/shared data; `INSERT/UPDATE/DELETE` limited to Admins and Teachers (for their students). Roles are enforced via the `user_role` enum (`admin`, `teacher`, `student`).

---

## Database Connection (Dual Local/Remote Routing)

The app routes every request to either a **local** Supabase (`http://127.0.0.1:54321`, development) or a **remote** Supabase (production/staging). Connection pooling is handled by Supabase; routing adds minimal overhead (single connection per request).

**Routing precedence:**

1. Request header `X-Database-Preference: local|remote`
2. Cookie `sb-provider-preference` (values `local|remote`, 1-year max-age)
3. Environment default (prefers local when configured)

**Core modules** (`lib/database/`):

| File / Symbol                                                                                                                | Role                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `connection.ts` — `getDatabaseConfig`, `testConnection`                                                                      | Low-level config + connectivity check (returns `url`, `type`, `latency`)                                     |
| `middleware.ts` — `createRoutedSupabaseClient`, `createRoutedServerClient`, `DatabaseMiddleware`, `detectDatabasePreference` | Routed clients for API routes & server components; `DatabaseMiddleware.addHeaders()` stamps response headers |
| `hooks/useDatabaseStatus.ts`                                                                                                 | Client hook: `type`, `isLocal`, `toggleDatabase`, `switchTo`, `testConnection`                               |
| `app/api/database/status/route.ts`                                                                                           | `GET` status, `POST` test connection                                                                         |

**Response headers** (transparency): `X-Database-Type`, `X-Database-URL` (truncated), `X-Database-Source` (`cookie`/`header`/`default`).

**Environment variables:**

```bash
NEXT_PUBLIC_SUPABASE_LOCAL_URL / _ANON_KEY        # local dev
SUPABASE_LOCAL_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_REMOTE_URL / _ANON_KEY       # production
SUPABASE_REMOTE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY              # legacy fallback
```

---

## External API System

A unified HTTP interface under `app/api/external/` lets external applications hit the same dual-routed database with consistent, type-safe operations. Authentication uses bearer tokens (`api_keys` table); environment detection picks local vs remote automatically.

**Components:**

| Module                                    | Role                                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `lib/api/database-router.ts` — `dbRouter` | Detects active DB, issues raw HTTP requests (`get`/`post`/`put`/`patch`/`delete`) with auth headers |
| `lib/api/unified-db.ts` — `db`            | Type-safe CRUD convenience layer (`db.songs.findAll/create/update/delete`), RPC + raw query support |
| `app/api/external/*`                      | REST endpoints; each response embeds DB context                                                     |

**Endpoints** (examples): `GET/POST /api/external/songs`, `PUT/DELETE /api/external/songs/:id`, `GET /api/external/database/status`. Responses carry a `meta` object with `database` (local/remote) and `count` — never a bare `data` field.

---

## Rate Limiting

Two independent rate-limit systems guard abuse-prone surfaces. Both use in-memory `Map` storage (single-server scope; Redis/edge is the scaling path for multi-server).

### Auth endpoints (`lib/auth/rate-limiter.ts`)

Tracks per **email + IP** identifier. Prevents brute force and email enumeration (limits apply equally to valid, invalid, and non-existent emails — no information disclosure). Expired entries cleaned every 10 minutes.

| Operation      | Max Attempts | Window |
| -------------- | ------------ | ------ |
| Login          | 10           | 15 min |
| Password reset | 5            | 1 hour |
| Signup         | 3            | 1 hour |

API: `checkAuthRateLimit(identifier, operation)` → `{ allowed, remaining, resetTime, retryAfter? }`; also `resetAuthRateLimit`, `getAuthRateLimitStatus`, `clearAllAuthRateLimits`. IP is extracted from `x-forwarded-for` (first entry) → `x-real-ip` → `unknown`. A `check_auth_rate_limit` Postgres RPC backs the DB-side check. User-facing messages are intentionally generic; server logs carry detail for monitoring.

### AI endpoints (`lib/ai/rate-limiter.ts`)

Role-based per-minute request limits:

| Role      | Limit     |
| --------- | --------- |
| Admin     | 100 / min |
| Teacher   | 50 / min  |
| Student   | 20 / min  |
| Anonymous | 5 / min   |

On limit, returns `{ error, retryAfter }` with user-friendly messaging ("5 requests remaining", "try again in 2 minutes") surfaced in the streaming status UI.

---

## AI System

Administrative AI assistance with multi-provider support, specialized agents, and SSE streaming. Sole UI generation path is the editorial flow.

### Providers (`lib/ai/provider-factory.ts`)

Selected via `AI_PROVIDER` (`auto` | `openrouter` | `ollama`).

| Provider           | Module                    | Notes                                                                                                                  |
| ------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| OpenRouter (cloud) | `providers/openrouter.ts` | Multiple LLMs; `OPENROUTER_API_KEY`. Models incl. llama-3.3-70b, gemini-2.0-flash, deepseek-r1, mistral-7b (free tier) |
| Ollama (local)     | `providers/ollama.ts`     | Self-hosted; `OLLAMA_BASE_URL` (default `http://localhost:11434`)                                                      |
| Auto               | factory                   | Tries local Ollama first (`AI_PREFER_LOCAL=true`), falls back to OpenRouter                                            |

Model names auto-map between providers (e.g. `meta-llama/llama-3.3-70b-instruct:free` ↔ `llama3.2`, `deepseek-r1`, `mistral`). Provider failures retry with exponential backoff (3 attempts, `retry.ts`) before falling back or erroring.

### Agents (`lib/ai/agent-registry.ts`, `agent-specifications.ts`, `agent-execution.ts`)

Registered agents, executed via `executeAgent(agentId, context, metadata?)` or type-safe wrappers:

| Agent ID                    | Purpose                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `email-draft-generator`     | Student-communication emails (lesson_reminder, progress_report, payment_reminder, milestone_celebration) |
| `lesson-notes-assistant`    | Structured lesson documentation + practice recommendations                                               |
| `assignment-generator`      | Personalized practice assignments (student level/songs/techniques)                                       |
| `post-lesson-summary`       | Student/parent-friendly lesson summaries                                                                 |
| `student-progress-insights` | Learning-pattern analysis + recommendations                                                              |
| `admin-dashboard-insights`  | Business intelligence (Admin only)                                                                       |

Server Actions (`app/actions/ai.ts`): `generateAIResponse(prompt, model?)`, `getAvailableModels()`, plus `createAIStreamFromProvider()`.

### Security

- **Input sanitization** (`registry/validation.ts`): blocks prompt injection, role-marker manipulation, code-block injection, sensitive-data exposure.
- **Sensitive-data modes** per agent: `block` (reject), `sanitize` (mask emails/cards), `allow`.
- Rate limiting as above.

### Streaming (SSE)

True Server-Sent-Events streaming end to end — real-time token chunks (not fake word-by-word), with Time-to-First-Token under ~1s.

- **Provider**: `openrouter.ts` `completeStream()` parses SSE, supports `AbortSignal` cancellation, reasoning-content extraction (DeepSeek R1), token-usage tracking. `AIStreamChunk` type in `lib/ai/types.ts`.
- **Hook** `hooks/useAIStream.ts`: state machine `idle → queued → connecting → streaming → complete/error/cancelled`; manages `AbortController`; callbacks `onChunk/onComplete/onError/onCancel`; integrates queue, analytics, token estimation.
- **UI** `components/ai/`: `AIStreamingStatus` (status icons, progress bar, token badge, queue position, reasoning section, cancel/retry), `AIErrorBoundary`. `AIAssistButton` carries inline streaming state.
- **Token estimation** (`token-estimation.ts`): model-specific char→token ratios and per-agent expected lengths drive progress bars, time-remaining, and tokens/sec.
- **Analytics** (`streaming-analytics.ts`): TTFT, tokens/sec, duration, success/error/cancel rates; aggregate over last 100 sessions; reports to Vercel Analytics in production.
- **Queue** (`queue-manager.ts`): max 2 concurrent requests per user, up to 5 queued, 60s timeout, position display, cancellation, expired-request cleanup.

---

## Security Considerations

- RLS enforces data isolation at the database level (ADR-0001).
- Secrets live in server-side env vars only — never client-exposed.
- Bearer tokens (`api_keys`) for external API; session auth for the web UI.
- Auth + AI rate limiting; prompt-injection protection on AI inputs.
- Structured Pino logging never logs secrets (ADR-0003).
