---
created: 2026-06-16
updated: 2026-06-16
---

# Strummy — API & Authentication Reference

Living reference for Strummy's HTTP API and authentication. For the plan see [`docs/app-blueprint/`](../README.md); for system architecture see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

> ⚠️ **Auth in transition.** The canonical auth seam is **`withApiAuth()`** (`lib/auth/withApiAuth.ts`). The blueprint roadmap deletes `lib/bearer-auth.ts` and routes every endpoint through `withApiAuth()`. The older `authenticateWithBearerToken()` / `authenticateWithSession()` helpers in `lib/bearer-auth.ts` are **being removed** — do not wire new routes to them. Examples below that reference those helpers describe the legacy path and are retained only for context.

---

## 1. Authentication

Two credential types are accepted on API routes. Both resolve to the same authenticated user + role context.

| Method           | Credential             | Header / Carrier                | Use case                                |
| ---------------- | ---------------------- | ------------------------------- | --------------------------------------- |
| Session cookie   | Supabase auth session  | `Cookie` (set on browser login) | First-party web app (browser)           |
| API key (bearer) | `gcrm_`-prefixed token | `Authorization: Bearer gcrm_…`  | External apps, scripts, iOS widgets, CI |

Resolution order (via `withApiAuth()`): bearer token is tried first; if absent, falls back to the session cookie. Missing/invalid credentials return `401`.

### API key properties

| Property       | Value                                                           |
| -------------- | --------------------------------------------------------------- |
| Format         | `gcrm_<random-base64>` (e.g. `gcrm_b5KjLmQpR8xYzWvAhNdEfG==`)   |
| Generation     | `crypto.getRandomValues()`                                      |
| Storage        | SHA256 hash only — plain key never stored                       |
| Visibility     | Plain key shown **once** at creation; not recoverable           |
| Scope          | Per-user; inherits that user's role (admin / teacher / student) |
| Lifecycle      | Active until revoked. No expiry/TTL, no per-key scopes (yet)    |
| Isolation      | RLS ensures a user can only see/create/revoke their own keys    |
| Usage tracking | `last_used_at` updated on each authenticated request            |

### `api_keys` table

```sql
CREATE TABLE public.api_keys (
  id           UUID PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  name         TEXT NOT NULL,
  key_hash     TEXT NOT NULL UNIQUE,   -- SHA256
  last_used_at TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active    BOOLEAN NOT NULL DEFAULT true
);
```

RLS is enabled with SELECT / INSERT / UPDATE / DELETE policies, each scoped to `user_id = auth.uid()`.

### Key helpers (`lib/api-keys.ts`)

| Function                                | Purpose                                |
| --------------------------------------- | -------------------------------------- |
| `generateApiKey(): string`              | Create a new `gcrm_…` key              |
| `hashApiKey(key: string): string`       | SHA256 hash for storage / lookup       |
| `verifyApiKey(plainKey, hash): boolean` | Compare a plain key to its stored hash |

### Security rules

- Never log plain tokens. Treat keys like passwords; HTTPS only in production.
- One key per integration/device; name them descriptively (`iOS Widget – iPhone 14`).
- Rotate periodically; revoke immediately if compromised.

---

## 2. Managing API keys

### Endpoints

| Method | Endpoint             | Auth                  | Description                               |
| ------ | -------------------- | --------------------- | ----------------------------------------- |
| GET    | `/api/api-keys`      | Session **or** bearer | List your keys (metadata only, no hashes) |
| POST   | `/api/api-keys`      | Session **or** bearer | Create a key (returns plain key once)     |
| DELETE | `/api/api-keys/[id]` | Session **or** bearer | Revoke a key                              |

### Generate a key — via UI

1. Go to **Settings → API Keys**.
2. Click **Create New API Key** and give it a memorable name.
3. **Copy the key immediately** — it is shown only once.

### Generate a key — via API

```bash
curl -X POST http://localhost:3000/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: [session-cookie]" \
  -d '{"name": "Mobile App"}'
```

Response:

```json
{
  "id": "uuid",
  "name": "Mobile App",
  "key": "gcrm_[base64-token]",
  "is_active": true,
  "created_at": "2026-01-01T08:00:00Z",
  "warning": "Save your API key now. You will not be able to see it again."
}
```

### List keys

```bash
curl http://localhost:3000/api/api-keys \
  -H "Authorization: Bearer gcrm_[your-key]"
```

```json
[
  {
    "id": "uuid",
    "name": "Mobile App",
    "is_active": true,
    "created_at": "2026-01-01T08:00:00Z",
    "last_used_at": "2026-01-01T10:30:00Z"
  }
]
```

### Revoke a key

```bash
curl -X DELETE http://localhost:3000/api/api-keys/[id] \
  -H "Authorization: Bearer gcrm_[your-key]"
```

### Use a key against any protected endpoint

```bash
curl http://localhost:3000/api/song/[id] \
  -H "Authorization: Bearer gcrm_[your-key]"
```

```javascript
await fetch('/api/song', { headers: { Authorization: `Bearer ${apiKey}` } });
```

```python
import requests
requests.get('http://localhost:3000/api/song',
             headers={'Authorization': f'Bearer {api_key}'})
```

---

## 3. External API

Public-facing routes under `/api/external/*` are designed for bearer-token (API key) callers. Admin-scoped routes require an admin-role key.

| Method           | Endpoint                        | Auth            | Description                  |
| ---------------- | ------------------------------- | --------------- | ---------------------------- |
| GET, POST        | `/api/external/database/status` | api-key (admin) | DB status / connection test  |
| GET, POST        | `/api/external/songs`           | api-key         | List / create songs          |
| GET, PUT, DELETE | `/api/external/songs/[id]`      | api-key         | Get / update / delete a song |

### Examples

```bash
# List songs (with filters)
curl "http://localhost:3000/api/external/songs?level=beginner&limit=5" \
  -H "Authorization: Bearer gcrm_…"

# Create a song
curl -X POST http://localhost:3000/api/external/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer gcrm_…" \
  -d '{"title":"Wonderwall","author":"Oasis","level":"beginner","key":"Em"}'
```

### Database routing

The `X-Database-Preference: local | remote` header overrides DB selection on routes that support dual connections (see `/api/database/status`).

### Request headers

| Header                  | Purpose           | Example             |
| ----------------------- | ----------------- | ------------------- |
| `Authorization`         | Bearer auth       | `Bearer gcrm_…`     |
| `Content-Type`          | Request body type | `application/json`  |
| `X-Database-Preference` | DB routing        | `local` or `remote` |

### Error format

```json
{ "error": "Error message", "code": "ERROR_CODE", "details": {} }
```

| Code               | Status | Meaning                                   |
| ------------------ | ------ | ----------------------------------------- |
| `UNAUTHORIZED`     | 401    | Missing or invalid auth                   |
| `FORBIDDEN`        | 403    | Insufficient permissions (e.g. non-admin) |
| `NOT_FOUND`        | 404    | Resource not found                        |
| `VALIDATION_ERROR` | 400    | Invalid request data                      |
| `RATE_LIMITED`     | 429    | Too many requests                         |
| `SERVER_ERROR`     | 500    | Internal error                            |

---

## 4. iOS widget (Scriptable)

A home-screen widget for iPhone/iPad built with [Scriptable](https://apps.apple.com/app/scriptable/id1405459188), consuming the API via bearer token. Two variants share the same setup; they differ only by endpoint and required role.

|                  | Standard (dashboard)                                   | Admin (stats)                                                |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Endpoint         | `GET /api/widget/dashboard`                            | `GET /api/widget/admin`                                      |
| Required role    | Teacher / Student                                      | Admin only (403 otherwise)                                   |
| Data scope       | Personal lessons + assignments                         | System-wide statistics                                       |
| Shows            | Upcoming lessons, pending assignments, practice streak | User counts, lesson/song totals, 30-day trends, top teachers |
| Recommended size | Medium                                                 | Medium or Large                                              |

### Setup (both variants)

1. Install **Scriptable** (iOS 14+).
2. In Strummy: **Settings → API Keys → Create New API Key** (name it `iOS Widget` / `iOS Admin Widget`). For the admin widget, generate it from an **admin** account. Copy the key — shown once.
3. In Scriptable, create a new script, paste the widget code, and set:
   - `API_URL` → your deployment, e.g. `https://strummy.app/api/widget/dashboard` (or `…/admin`).
   - `API_KEY` → leave as `args.widgetParameter` to inject the key from the widget config.
4. Add a Scriptable widget to the home screen → **Edit Widget** → select the script → paste the API key into the **Parameter** field.

The script fetches the endpoint with `Authorization: Bearer <key>`, renders the result, and refreshes on the iOS background schedule (~15–30 min) or on tap.

### `GET /api/widget/dashboard` — response

```json
{
  "user": { "name": "John Doe", "role": "teacher" },
  "lessons": [
    { "id": "uuid", "date": "2026-01-10", "notes": "Practice scales", "with": "Student Name" }
  ],
  "assignments": [
    { "id": "uuid", "dueDate": "2026-01-15", "status": "in_progress", "song": "Wonderwall - Oasis" }
  ],
  "lastUpdated": "2026-01-09T14:30:00.000Z"
}
```

Teachers see upcoming lessons with student names + notes; students additionally see pending assignments with song status.

### `GET /api/widget/admin` — response (admin role required)

```json
{
  "user": { "name": "Admin Name", "role": "admin" },
  "stats": {
    "users": { "total": 150, "teachers": 25, "students": 120, "recentNew": 5 },
    "lessons": { "total": 1250, "recent30Days": 180, "upcoming7Days": 45 },
    "assignments": { "pending": 78 },
    "songs": { "total": 320 },
    "apiKeys": { "active": 12 }
  },
  "upcomingLessons": [
    { "id": "123", "date": "2026-01-10", "teacher": "John Smith", "student": "Alice Johnson" }
  ],
  "topTeachers": [{ "name": "John Smith", "lessons": 45 }],
  "lastUpdated": "2026-01-09T10:30:00.000Z"
}
```

A non-admin key returns `403 { "error": "Forbidden. Admin access required." }`.

### Test before adding the widget

```bash
curl -H "Authorization: Bearer gcrm_YOUR_KEY" \
     https://strummy.app/api/widget/dashboard
```

### Widget troubleshooting

| Symptom                                | Fix                                                                                            |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `Connection Error` / `Invalid API Key` | Re-check key (no spaces/line breaks), confirm it's still active, check connectivity            |
| `401 Unauthorized`                     | Include full `gcrm_` prefix; verify key not revoked; verify it belongs to you                  |
| `403 Forbidden` (admin widget)         | Account lacks admin role — confirm `user_roles` has `role='admin'`, regenerate key after grant |
| Stale data                             | Tap to refresh; enable Background App Refresh for Scriptable; remove/re-add widget             |
| Blank widget                           | Open Scriptable, run script with ▶️, check log; verify `API_URL` matches deployment            |

---

## 5. Related integrations (quick reference)

| Integration     | Key routes                                                                                                         | Notes                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Google Calendar | `GET /api/auth/google`, `GET /api/oauth2/callback`, `GET /api/calendar-sync`, `POST /api/webhooks/google-calendar` | OAuth via `GOOGLE_CLIENT_ID/SECRET/REDIRECT_URI`; lesson import matches students by email, dedupes via `google_event_id` |
| Spotify         | `GET /api/spotify/search`, `GET /api/spotify/authorize`, `POST /api/spotify/sync`, `POST /api/song/from-spotify`   | `SPOTIFY_CLIENT_ID/SECRET`; imports title, artist, duration, release year, cover, link                                   |
| Email / cron    | `GET /api/cron/daily-report`, `…/weekly-digest`, etc.                                                              | Vercel Cron; authorized by `CRON_SECRET` (`Authorization: Bearer <CRON_SECRET>`); `GMAIL_USER` / `GMAIL_APP_PASSWORD`    |

---

## Appendix — Route inventory summary

Auto-generated by `npm run audit:routes` (route-audit script). **Regenerated, not hand-edited** — the canonical listing lives in `docs/2026-05-13-api-inventory.md`. Snapshot totals:

- **Route files**: 118 · **HTTP handlers**: 162 · **LOC**: ~15,006 · **Domains**: 30

Auth column legend: `user` = session/bearer user · `api-key` = bearer only · `cron-secret` = `CRON_SECRET` · `role:…` = role gate · `admin-client` = service-role Supabase client · `_none_` = public.

| Domain        | Routes | Notable auth                                              |
| ------------- | ------ | --------------------------------------------------------- |
| admin         | 9      | `user`, `role:admin`, `service-role`                      |
| ai            | 1      | `user`                                                    |
| api-keys      | 2      | `user`                                                    |
| assignments   | 2      | `user` (AssignmentSchema)                                 |
| auth          | 1      | `_none_` (`/api/auth/google`)                             |
| calendar      | 1      | `user`                                                    |
| calendar-sync | 1      | `user`                                                    |
| cohorts       | 1      | `role:admin+teacher`                                      |
| cron          | 13     | `cron-secret`                                             |
| dashboard     | 1      | `user`                                                    |
| database      | 1      | `user`                                                    |
| drive         | 4      | `user` (DriveFileSchema)                                  |
| exports       | 1      | `role:admin+teacher+student`                              |
| external      | 3      | `api-key` (+`role:admin` on db status)                    |
| health        | 1      | `user`                                                    |
| lessons       | 15     | `user`                                                    |
| notifications | 2      | `user`                                                    |
| oauth2        | 1      | `user`                                                    |
| profiles      | 1      | `user`                                                    |
| repertoire    | 1      | `user` (StudentRepertoireSchema)                          |
| song          | 25     | `user`, `role:admin+teacher+student` (SongSchema)         |
| spotify       | 15     | `user` (+`_none_` callback)                               |
| stats         | 1      | `user`                                                    |
| student       | 3      | `user`                                                    |
| students      | 3      | `user`                                                    |
| teacher       | 2      | `user`                                                    |
| teachers      | 1      | `role:admin+teacher`                                      |
| users         | 3      | `user`, `role:admin+teacher+student`                      |
| webhooks      | 1      | `admin-client`                                            |
| widget        | 2      | `api-key` (`dashboard`: teacher+student · `admin`: admin) |

For the full per-route table (method, path, schema, LOC) regenerate the inventory or read `docs/2026-05-13-api-inventory.md`.
