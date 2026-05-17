# Guitar CRM Architecture

## 🏗️ System Overview

Guitar CRM is a comprehensive student management system designed for guitar teachers. It uses a modern tech stack focused on type safety, performance, and developer experience.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| State Management | TanStack Query (Server State), React Context (UI) |
| Validation | Zod |
| Testing | Jest (Unit/Integration), Cypress (E2E) |
| AI | OpenRouter (Cloud), Ollama (Local) |

---

## 🔐 Role-Based Access Control (RBAC)

The system implements a strict three-tier role system enforced at both the database level (RLS) and application level.

### Roles

| Role | Access Level |
|------|-------------|
| **Admin** | Full system access, user management, system configuration |
| **Teacher** | Manage own students, create/edit lessons, manage song library |
| **Student** | View assigned lessons, songs, and assignments (read-only) |

### Data Access Matrix

| Entity | Admin | Teacher | Student |
|--------|-------|---------|---------|
| Users | Full Access | View Students | View Self |
| Lessons | Full Access | CRUD (Own Students) | Read (Own) |
| Songs | Full Access | CRUD (Own Students) | Read (Assigned) |
| Assignments | Full Access | CRUD (Own Students) | Read (Own) |

---

## 🗄️ Database Schema

The database is hosted on Supabase and uses PostgreSQL.

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | Extends Supabase Auth users with role flags, name, contact info |
| `user_roles` | Junction table for user-role assignments |
| `songs` | Song library with metadata, Spotify integration, soft delete |
| `lessons` | Lesson scheduling, linked to student/teacher profiles |
| `lesson_songs` | Junction table for songs assigned to lessons |
| `assignments` | Tasks assigned to students |
| `assignment_templates` | Reusable assignment templates |
| `api_keys` | Bearer token authentication for external apps |
| `user_integrations` | OAuth tokens (Google Calendar) |
| `webhook_subscriptions` | External webhook management |

### History Tables (Automatic Triggers)

| Table | Purpose |
|-------|---------|
| `assignment_history` | Tracks all assignment changes |
| `lesson_history` | Tracks lesson rescheduling, status changes |
| `song_status_history` | Tracks student progress through song statuses |

### Enums

| Enum | Values |
|------|--------|
| `user_role` | admin, teacher, student |
| `lesson_status` | SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, RESCHEDULED |
| `lesson_song_status` | to_learn, started, remembered, with_author, mastered |
| `assignment_status` | not_started, in_progress, completed, overdue, cancelled |
| `difficulty_level` | beginner, intermediate, advanced |
| `music_key` | C, C#, Db, D, ... (31 values including minor keys) |

### Row Level Security (RLS)

All tables have RLS enabled with policies enforcing role-based access:
- **Select**: Users see their own data or data shared with them
- **Insert/Update/Delete**: Only Admins or Teachers (for their students) can modify

---

## 📂 Directory Structure

```
app/
├── (auth)/              # Authentication routes (sign-in, sign-up)
├── (debug)/             # Debug pages (development only)
├── actions/             # Server Actions
├── ai/                  # AI development pages
├── api/                 # API Route Handlers
├── auth/                # Auth callback handlers
├── dashboard/           # Protected dashboard routes
│   ├── admin/           # Admin-only pages
│   ├── assignments/     # Assignment management
│   ├── lessons/         # Lesson management
│   ├── songs/           # Song library
│   ├── users/           # User management
│   └── settings/        # User settings
└── onboarding/          # First-time user setup

components/
├── assignments/         # Assignment components
├── auth/                # Auth forms
├── dashboard/           # Dashboard widgets
├── layout/              # Layout components
├── lessons/             # Lesson components
├── navigation/          # Sidebar, breadcrumbs
├── shared/              # Shared utilities
├── songs/               # Song components
├── ui/                  # shadcn/ui components
└── users/               # User management components

lib/
├── ai/                  # AI provider abstraction
├── api/                 # API utilities, database router
├── database/            # Database connection layer
├── services/            # Business logic services
├── supabase/            # Supabase client utilities
└── utils/               # General utilities

schemas/                 # Zod validation schemas
types/                   # TypeScript type definitions
```

---

## 🧩 Component Organization

For domain-specific components, use this standard structure:

```
components/[domain]/
├── actions/           # Action buttons, dialog triggers
├── details/           # Detail view components
├── form/              # Create/edit forms
├── hooks/             # Domain-specific hooks
├── list/              # List/table components
├── index.ts           # Public API exports
└── types/             # Local type definitions (optional)
```

---

## 🔄 State Management & Data Fetching

We use **TanStack Query** (React Query) for all server state management.

### Pattern

```typescript
// Custom hook encapsulates query logic
export function useSongList() {
  return useQuery({
    queryKey: ['songs'],
    queryFn: () => apiClient.get('/api/songs')
  });
}

// Usage in component
function SongList() {
  const { data, isLoading, error } = useSongList();
  // ...
}
```

### Benefits
- Automatic caching and background refetching
- Built-in loading and error states
- Request deduplication
- Optimistic updates

---

## 🌐 Database Connection Layer

The application supports dual database connections:
- **Local Supabase** (`http://127.0.0.1:54321`) - for development
- **Remote Supabase** - for production/staging

### Routing Logic

1. Request header override (`X-Database-Preference`)
2. Cookie preference (`sb-provider-preference`)
3. Environment defaults (prefers local if available)

### Configuration

```bash
# Local Supabase
NEXT_PUBLIC_SUPABASE_LOCAL_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY=your-local-anon-key

# Remote Supabase
NEXT_PUBLIC_SUPABASE_REMOTE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_REMOTE_ANON_KEY=your-remote-anon-key
```

---

## 🚀 Deployment

### Environments

| Branch | Environment | URL |
|--------|-------------|-----|
| `main` | Preview/Staging | Auto-deployed to Vercel Preview |
| `production` | Production | Auto-deployed to Vercel Production |

### Release Process

1. Merge features into `main`
2. Verify on Preview deployment
3. Merge `main` into `production` to release

---

## 🔒 Security Considerations

- API keys stored in server-side environment variables only
- RLS policies enforce data isolation at database level
- Bearer token authentication for external API access
- Session-based authentication for web UI
- Rate limiting on AI endpoints
- Prompt injection protection for AI inputs
