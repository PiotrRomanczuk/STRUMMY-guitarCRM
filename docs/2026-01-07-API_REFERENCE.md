# API Reference & External Integrations

## 🔐 Bearer Token Authentication

Guitar CRM supports bearer token authentication for external applications.

### Generating API Keys

**Via UI:**
1. Go to Settings → API Keys
2. Click "Generate New Key"
3. Copy the key immediately (shown once only)
4. Give it a memorable name

**Via API:**
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
  "key": "gcrm_[base64-encoded-token]",
  "created_at": "2025-12-09T08:00:00Z",
  "warning": "Save your API key now. You will not be able to see it again."
}
```

### Using Bearer Tokens

Include in the `Authorization` header:

```bash
curl http://localhost:3000/api/songs/[song-id] \
  -H "Authorization: Bearer gcrm_[your-api-key]"
```

### API Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/api-keys` | List your API keys |
| POST | `/api/api-keys` | Create new API key |
| DELETE | `/api/api-keys/[id]` | Revoke an API key |

---

## 📱 iOS Widgets (Scriptable)

### Student Widget

Shows upcoming lessons and assignments.

**Setup:**
1. Install [Scriptable](https://apps.apple.com/app/scriptable/id1405459188)
2. Generate API key in Settings
3. Create new script with the widget code
4. Configure widget parameter with API key
5. Add widget to home screen

**Widget Features:**
- 🎸 Upcoming lessons
- ✅ Pending assignments
- 📊 Practice streak

### Admin Widget

Shows system-wide statistics (admin role required).

**Widget Features:**
- 👥 User counts
- 📚 Lesson statistics
- 🎵 Song library stats
- ⚠️ Alerts

**API Endpoints:**
| Endpoint | Access | Purpose |
|----------|--------|---------|
| `/api/widget/dashboard` | All roles | Personal dashboard data |
| `/api/widget/admin` | Admin only | System statistics |

---

## 🔌 External Database API

### Database Status

```bash
# Get current database status
GET /api/database/status

# Test connection
POST /api/database/status

# Override preference
GET /api/database/status -H "X-Database-Preference: remote"
```

### Unified Database API

```typescript
import { db } from '@/lib/api/unified-db';

// Get all songs
const songs = await db.songs.findAll({
  filter: { level: 'beginner' },
  limit: 10
});

// Create song
const newSong = await db.songs.create({
  title: 'Wonderwall',
  author: 'Oasis',
  level: 'beginner',
  key: 'Em'
});

// Update song
const updated = await db.songs.update('song-id', {
  title: 'Updated Title'
});

// Delete song
await db.songs.delete('song-id');
```

### External HTTP API

```bash
# Get database status
curl http://localhost:3000/api/external/database/status

# Get all songs
curl http://localhost:3000/api/external/songs

# Get songs with filters
curl "http://localhost:3000/api/external/songs?level=beginner&limit=5"

# Create song
curl -X POST http://localhost:3000/api/external/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer gcrm_..." \
  -d '{
    "title": "Test Song",
    "author": "Test Artist",
    "level": "beginner",
    "key": "C"
  }'
```

---

## 📅 Google Calendar Integration

### OAuth Setup

1. Create Google Cloud project
2. Enable Calendar API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add credentials to environment:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth2/callback
```

### Connecting Account

1. Go to Settings → Integrations
2. Click "Connect Google Calendar"
3. Authorize access
4. Select calendars to sync

### Importing Lessons

```bash
POST /api/lessons/import
{
  "calendar_id": "primary",
  "start_date": "2026-01-01",
  "end_date": "2026-01-31"
}
```

**Features:**
- Automatic student matching by email
- Shadow profile creation for new students
- Duplicate prevention via `google_event_id`

---

## 📧 Email Notifications

### Cron Job Configuration

Email reports run via Vercel Cron:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 20 * * *"
    }
  ]
}
```

### Environment Variables

```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
CRON_SECRET=your-secure-random-string
```

### Manual Trigger

```bash
curl http://localhost:3000/api/cron/daily-report \
  -H "Authorization: Bearer [CRON_SECRET]"
```

---

## 🎵 Spotify Integration

### Configuration

```bash
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
```

### Search API

```bash
GET /api/spotify/search?q=wonderwall&limit=10
```

Response:
```json
{
  "tracks": [
    {
      "id": "spotify-id",
      "name": "Wonderwall",
      "artists": ["Oasis"],
      "album": "...",
      "duration_ms": 258000,
      "cover_url": "https://..."
    }
  ]
}
```

### Import from Spotify

```bash
POST /api/song/create
{
  "spotify_id": "spotify-track-id"
}
```

Automatically imports:
- Title and artist
- Duration
- Release year
- Cover image
- Spotify link

---

## 📊 API Endpoints Summary

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-in` | Sign in with email/password |
| POST | `/api/auth/sign-up` | Create new account |
| POST | `/api/auth/sign-out` | Sign out |
| POST | `/api/auth/reset-password` | Request password reset |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| GET | `/api/users/[id]` | Get user details |
| POST | `/api/users` | Create user |
| PUT | `/api/users/[id]` | Update user |
| DELETE | `/api/users/[id]` | Delete user |

### Songs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/song` | List songs |
| GET | `/api/song/[id]` | Get song details |
| POST | `/api/song/create` | Create song |
| PUT | `/api/song/update/[id]` | Update song |
| DELETE | `/api/song/[id]` | Delete song |
| GET | `/api/song/search` | Search songs |
| GET | `/api/song/stats` | Song statistics |

### Lessons

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lessons` | List lessons |
| GET | `/api/lessons/[id]` | Get lesson details |
| POST | `/api/lessons` | Create lesson |
| PUT | `/api/lessons/[id]` | Update lesson |
| DELETE | `/api/lessons/[id]` | Delete lesson |
| GET | `/api/lessons/search` | Search lessons |
| POST | `/api/lessons/bulk` | Bulk operations |

### Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | List assignments |
| GET | `/api/assignments/[id]` | Get assignment details |
| POST | `/api/assignments` | Create assignment |
| PUT | `/api/assignments/[id]` | Update assignment |
| DELETE | `/api/assignments/[id]` | Delete assignment |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/weekly` | Weekly statistics |
| GET | `/api/stats/songs` | Song library stats |
| GET | `/api/stats/lessons` | Lesson statistics |
| GET | `/api/dashboard` | Dashboard data |

---

## 🔧 Request Headers

| Header | Purpose | Example |
|--------|---------|---------|
| `Authorization` | Bearer token auth | `Bearer gcrm_...` |
| `Content-Type` | Request body type | `application/json` |
| `X-Database-Preference` | DB routing | `local` or `remote` |

---

## ⚠️ Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid auth |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal error |
