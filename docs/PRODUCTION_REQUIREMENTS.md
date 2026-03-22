# Guitar CRM - Production Requirements Document

## 📋 Overview

This document details all the requirements, configurations, and dependencies needed to deploy Guitar CRM to production. It covers environment variables, external services, database setup, and infrastructure considerations.

---

## 🔧 Environment Variables

### Required Environment Variables

These variables **MUST** be set for the application to function in production.

#### Supabase (Database & Authentication)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (public) | `eyJhbGciOiJIUzI1NiIsInR5...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) | `eyJhbGciOiJIUzI1NiIsInR5...` |

**Alternative naming (also supported):**
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_REMOTE_URL` | Alternative to `NEXT_PUBLIC_SUPABASE_URL` |
| `NEXT_PUBLIC_SUPABASE_REMOTE_ANON_KEY` | Alternative to `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_REMOTE_SERVICE_ROLE_KEY` | Alternative to `SUPABASE_SERVICE_ROLE_KEY` |

#### Application URLs

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Production app URL | `https://guitar-crm.vercel.app` |
| `NEXT_PUBLIC_SITE_URL` | Site URL for auth redirects | `https://guitar-crm.vercel.app` |
| `NEXT_PUBLIC_API_BASE_URL` | API base URL | `https://guitar-crm.vercel.app/api` |
| `NEXT_PUBLIC_API_BASE_URL_REMOTE` | Remote API URL (if different) | `https://guitar-crm.vercel.app/api` |

### Optional Environment Variables (Feature-Dependent)

#### Email (Gmail SMTP)

Required if you want email functionality (lesson reminders, admin reports):

| Variable | Description | Example |
|----------|-------------|---------|
| `GMAIL_USER` | Gmail account for sending emails | `yourapp@gmail.com` |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not regular password) | `xxxx xxxx xxxx xxxx` |

**Setup Steps:**
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account → Security → App Passwords
3. Generate a new app password for "Mail"
4. Use the 16-character password as `GMAIL_APP_PASSWORD`

#### Spotify Integration

Required if you want Spotify song metadata and search:

| Variable | Description | Example |
|----------|-------------|---------|
| `SPOTIFY_CLIENT_ID` | Spotify Developer App Client ID | `abc123def456...` |
| `SPOTIFY_CLIENT_SECRET` | Spotify Developer App Client Secret | `xyz789abc123...` |

**Setup Steps:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Copy the Client ID and Client Secret

#### Google Calendar Integration

Required if you want Google Calendar sync for lessons:

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth2 Client ID | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 Client Secret | `GOCSPX-xxxxxxxx` |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | `https://guitar-crm.vercel.app/api/oauth2/callback` |

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials (Web Application)
5. Add authorized redirect URI: `https://yourdomain.com/api/oauth2/callback`
6. Copy Client ID and Client Secret

#### AI Features

Required if you want AI-powered features (email drafts, lesson notes, etc.):

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | OpenRouter API key for cloud AI | `sk-or-v1-xxxxx...` |
| `AI_PROVIDER` | AI provider selection | `openrouter`, `ollama`, or `auto` |
| `AI_PREFER_LOCAL` | Prefer local Ollama if available | `true` or `false` |
| `OLLAMA_BASE_URL` | Ollama server URL (if self-hosted) | `http://localhost:11434` |

**Setup Steps (OpenRouter):**
1. Go to [OpenRouter](https://openrouter.ai)
2. Create an account and generate an API key
3. Add credits or use free tier models

#### Cron Jobs (Vercel)

Required for scheduled tasks like daily reports:

| Variable | Description | Example |
|----------|-------------|---------|
| `CRON_SECRET` | Secret for authenticating cron requests | `your-secure-random-string` |

**Note:** Generate a secure random string (min 32 characters) using:
```bash
openssl rand -base64 32
```

#### Sentry Error Tracking

Already configured in the codebase with DSN hardcoded. For custom setup:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (optional override) | `https://xxx@sentry.io/xxx` |

---

## 🗄️ Database (Supabase)

### Requirements

1. **PostgreSQL Version**: 17 (as configured in `supabase/config.toml`)
2. **Supabase Project**: Active Supabase project with:
   - Database enabled
   - Authentication enabled
   - Realtime enabled (for real-time updates)

### Database Setup

#### Running Migrations

All migrations are in `supabase/migrations/`. Apply them in order:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually via Supabase Dashboard SQL Editor
```

#### Required Tables

| Table | Purpose | Critical |
|-------|---------|----------|
| `profiles` | User profiles with roles | ✅ Yes |
| `user_roles` | Role assignments | ✅ Yes |
| `songs` | Song library | ✅ Yes |
| `lessons` | Lesson scheduling | ✅ Yes |
| `lesson_songs` | Songs in lessons | ✅ Yes |
| `assignments` | Student assignments | ✅ Yes |
| `assignment_templates` | Reusable templates | ⚠️ Optional |
| `api_keys` | Bearer token auth | ⚠️ Optional (for external API) |
| `user_integrations` | OAuth tokens (Google) | ⚠️ Optional (for Google Calendar) |
| `webhook_subscriptions` | Webhook management | ⚠️ Optional (for Google Calendar) |
| `assignment_history` | Change tracking | ⚠️ Optional |
| `lesson_history` | Change tracking | ⚠️ Optional |
| `song_status_history` | Progress tracking | ⚠️ Optional |
| `student_song_progress` | **DEPRECATED** — use `student_repertoire` | ⛔ Deprecated |
| `practice_sessions` | Practice logging | ⚠️ Optional |
| `ai_conversations` | AI chat history | ⚠️ Optional (for AI features) |
| `ai_messages` | AI messages | ⚠️ Optional (for AI features) |
| `agent_execution_logs` | AI agent logs | ⚠️ Optional (for AI features) |
| `spotify_matches` | Spotify song matches | ⚠️ Optional (for Spotify) |

#### Required Enums

```sql
-- These must exist in the database
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
CREATE TYPE lesson_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');
CREATE TYPE lesson_song_status AS ENUM ('to_learn', 'started', 'remembered', 'with_author', 'mastered');
CREATE TYPE assignment_status AS ENUM ('not_started', 'in_progress', 'completed', 'overdue', 'cancelled');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE music_key AS ENUM (...); -- 31 values for musical keys
CREATE TYPE ai_context_type AS ENUM ('general', 'lesson', 'student', 'song', 'assignment');
```

#### Row Level Security (RLS)

All tables have RLS enabled. Policies are defined in migrations:
- `20260105100020_enable_rls.sql` through `20260105100027_rls_other_tables.sql`

### Required Database Functions

Located in migrations `20260105100003_create_functions.sql` and `20260105100017_create_functions_with_deps.sql`:

- `handle_new_user()` - Creates profile on user signup
- `increment_lesson_number()` - Auto-increments lesson numbers
- Various helper functions for RLS policies

### Required Triggers

Located in `20260105100019_create_triggers.sql` and history triggers:
- New user profile creation trigger
- Lesson number auto-increment trigger
- History tracking triggers for assignments, lessons, users

---

## 🔐 Authentication

### Supabase Auth Configuration

#### Required Settings (in Supabase Dashboard)

1. **Site URL**: Set to your production URL
   - Dashboard → Authentication → URL Configuration → Site URL
   - Example: `https://guitar-crm.vercel.app`

2. **Redirect URLs**: Add allowed redirect URLs
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/api/oauth2/callback` (for Google)
   - `https://yourdomain.com/dashboard`
   - `https://yourdomain.com/onboarding`

3. **Email Templates** (Optional): Customize auth emails
   - Dashboard → Authentication → Email Templates

#### Google OAuth Provider (Optional)

If you want "Sign in with Google":

1. In Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
4. Add redirect URL in Google Cloud Console:
   - `https://yourdomain.supabase.co/auth/v1/callback`

### JWT Configuration

- **JWT Expiry**: 3600 seconds (1 hour) - configurable in Supabase Dashboard
- **Refresh Token Rotation**: Enabled

---

## 📦 External Services

### Required Services

| Service | Purpose | Required |
|---------|---------|----------|
| Supabase | Database, Auth, Realtime | ✅ Yes |
| Vercel | Hosting, Edge Functions | ✅ Yes (or alternative) |

### Optional Services

| Service | Purpose | Required For |
|---------|---------|--------------|
| Gmail (SMTP) | Email sending | Email notifications |
| Spotify API | Song metadata | Spotify integration |
| Google Calendar API | Calendar sync | Google Calendar import |
| OpenRouter | Cloud AI | AI features |
| Sentry | Error tracking | Already configured |

---

## 🚀 Deployment (Vercel)

### Vercel Configuration

The `vercel.json` file configures:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "regions": ["iad1"],
  "functions": {
    "app/**": { "maxDuration": 30 }
  },
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 20 * * *"
    }
  ]
}
```

### Deployment Steps

1. **Connect Repository**: Link your GitHub repo to Vercel

2. **Set Environment Variables**: In Vercel Dashboard → Settings → Environment Variables:
   - Add all required environment variables (see above)
   - Mark sensitive variables as "Secret"

3. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Database Setup**: Before first deployment:
   - Create Supabase project
   - Run all migrations
   - Set up initial admin user

5. **Deploy**:
   ```bash
   vercel deploy --prod
   ```

### Branch Workflow

| Branch | Environment | Purpose |
|--------|-------------|---------|
| `main` | Preview | Testing and staging |
| `production` | Production | Live releases |

---

## 🔄 Cron Jobs

### Daily Report Cron

- **Path**: `/api/cron/daily-report`
- **Schedule**: `0 20 * * *` (8:00 PM UTC daily)
- **Purpose**: Sends admin email with song/activity report
- **Authentication**: Requires `CRON_SECRET` bearer token

### Setup

1. Set `CRON_SECRET` environment variable in Vercel
2. Vercel automatically calls the endpoint with the secret

---

## 📊 Monitoring

### Sentry Integration

Already configured with:
- Client-side error tracking
- Server-side error tracking
- Edge function tracking
- Session replay (10% sample rate)
- AI/Vercel integration

**DSN**: Hardcoded in `sentry.*.config.ts` files

### Monitoring Route

The app exposes `/monitoring` as a tunnel route for Sentry (to bypass ad-blockers).

---

## 🖼️ Image Handling

### Allowed Image Domains

Configured in `next.config.ts`:

```typescript
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'zmlluqqqwrfhygvpfqka.supabase.co' },
    { protocol: 'https', hostname: 'i.scdn.co' },  // Spotify album art
  ]
}
```

**Note**: Update the Supabase hostname to match your project.

---

## ✅ Pre-Deployment Checklist

### Essential

- [ ] Supabase project created and configured
- [ ] All database migrations applied
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `NEXT_PUBLIC_APP_URL` set
- [ ] `NEXT_PUBLIC_SITE_URL` set
- [ ] Supabase Auth redirect URLs configured
- [ ] At least one admin user created in database
- [ ] RLS policies verified working

### Email Features

- [ ] Gmail account set up with App Password
- [ ] `GMAIL_USER` set
- [ ] `GMAIL_APP_PASSWORD` set

### Spotify Integration

- [ ] Spotify Developer app created
- [ ] `SPOTIFY_CLIENT_ID` set
- [ ] `SPOTIFY_CLIENT_SECRET` set

### Google Calendar Integration

- [ ] Google Cloud project created
- [ ] Calendar API enabled
- [ ] OAuth credentials created
- [ ] `GOOGLE_CLIENT_ID` set
- [ ] `GOOGLE_CLIENT_SECRET` set
- [ ] `GOOGLE_REDIRECT_URI` set
- [ ] Redirect URI added in Google Console

### AI Features

- [ ] OpenRouter account created
- [ ] `OPENROUTER_API_KEY` set
- [ ] `AI_PROVIDER` set to desired value

### Cron Jobs

- [ ] `CRON_SECRET` generated and set
- [ ] Vercel cron job configured

### Domain & SSL

- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (Vercel handles this)

---

## 🔒 Security Considerations

### Environment Variable Security

1. **Never commit secrets**: Use `.env.local` for local development (gitignored)
2. **Use Vercel Secrets**: Mark sensitive vars as encrypted in Vercel
3. **Service Role Key**: Only use server-side, never expose to client

### API Security

1. **Bearer Token Auth**: For external API access (`/api/external/*`)
2. **RLS Enforcement**: All database queries go through RLS
3. **Middleware Auth**: Protected routes require valid session

### Content Security

1. **Sentry Tunnel**: Routes Sentry through `/monitoring` to avoid blockers
2. **CORS**: Handled by Next.js middleware

---

## 📝 Minimum Viable Production Setup

For a minimal production deployment:

### Environment Variables (Minimum)

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App URLs (Required)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_BASE_URL=https://your-app.vercel.app/api
```

### Features Available with Minimum Setup

| Feature | Available |
|---------|-----------|
| User authentication | ✅ Yes |
| Dashboard access | ✅ Yes |
| Song management | ✅ Yes |
| Lesson scheduling | ✅ Yes |
| Assignment management | ✅ Yes |
| Student/Teacher management | ✅ Yes |
| Email notifications | ❌ No |
| Spotify integration | ❌ No |
| Google Calendar sync | ❌ No |
| AI features | ❌ No |
| Daily reports cron | ❌ No |

---

## 🆘 Troubleshooting

### Common Issues

1. **"Supabase configuration missing" error**
   - Check that all Supabase env vars are set
   - Verify the URL format (must include `https://`)

2. **Auth redirects failing**
   - Verify redirect URLs in Supabase Dashboard
   - Check `NEXT_PUBLIC_SITE_URL` matches your domain

3. **RLS blocking queries**
   - Ensure user has correct role in `profiles` table
   - Check that `is_active` is `true` in profiles

4. **Email not sending**
   - Verify Gmail App Password (not regular password)
   - Check 2FA is enabled on Gmail account

5. **AI features not working**
   - Verify `OPENROUTER_API_KEY` is valid
   - Check OpenRouter account has credits

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Spotify API Documentation](https://developer.spotify.com/documentation)
- [Google Calendar API](https://developers.google.com/calendar/api)

---

## 📊 Feature Implementation & Testing Matrix

This table shows the implementation status and test coverage for each major feature.

### Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Fully implemented/tested |
| ⚠️ | Partially implemented/tested |
| ❌ | Not implemented/tested |
| 🔧 | In development |

### Core Features

| Feature | Implemented | Unit Tests | E2E Tests | Notes |
|---------|-------------|------------|-----------|-------|
| **Authentication** |
| Sign In | ✅ | ✅ `SignInForm.test.tsx`, `sign-in/page.test.tsx` | ✅ `auth-test.cy.ts` | Full coverage |
| Sign Up | ✅ | ✅ `SignUpForm.test.tsx`, `sign-up/page.test.tsx` | ✅ `auth-test.cy.ts` | Full coverage |
| Password Reset | ✅ | ✅ `ForgotPasswordForm.test.tsx`, `ResetPasswordForm.test.tsx` | ✅ `auth-password-reset.cy.ts` | Full coverage |
| Role-Based Access | ✅ | ✅ `middleware.test.ts`, `getUserWithRolesSSR.test.ts` | ✅ `auth-role-access.cy.ts` | Admin/Teacher/Student roles |
| Google OAuth | ✅ | ✅ `google.test.ts` | ❌ | OAuth flow difficult to E2E test |
| **User Management** |
| User List | ✅ | ✅ `users/page.test.tsx` | ✅ `admin-users-workflow.cy.ts` | Full CRUD |
| User Create/Edit | ✅ | ✅ `UserFormFields.test.tsx` | ✅ `admin-users-workflow.cy.ts` | Full coverage |
| User Roles | ✅ | ✅ `route.test.ts` (admin/users) | ✅ `admin-users-workflow.cy.ts` | Role assignment |
| User History | ✅ | ✅ `user-history.unit.test.ts` | ❌ | History tracking |
| User Profile | ✅ | ✅ `ProfileFormFields.test.tsx`, `ProfileComponents.test.tsx` | ⚠️ | Partial E2E |
| **Song Management** |
| Song List | ✅ | ✅ `SongList.test.tsx`, `songs/page.test.tsx` | ✅ `admin-songs-workflow.cy.ts` | Full CRUD |
| Song Create/Edit | ✅ | ✅ `SongForm.test.tsx` | ✅ `admin-song-crud.cy.ts` | Full coverage |
| Song Search/Filter | ✅ | ⚠️ | ✅ `song-search-filter.cy.ts` | Search integration tested |
| Song Schema Validation | ✅ | ✅ `SongSchema.test.ts` | ❌ | Zod validation |
| Song API Handlers | ✅ | ✅ `song/handlers.test.ts`, `song/integration.test.ts` | ✅ | API coverage |
| Song Status History | ✅ | ✅ `SongStatusHistory.unit.test.tsx`, `song-status-history.unit.test.ts` | ❌ | Progress tracking |
| Song Stats | ✅ | ✅ `SongStatsCharts.test.tsx`, `SongStatsTable.test.tsx` | ❌ | Dashboard charts |
| **Lesson Management** |
| Lesson List | ✅ | ✅ `LessonList.test.tsx` | ✅ `admin-lessons-workflow.cy.ts` | Full CRUD |
| Lesson Create/Edit | ✅ | ✅ `LessonForm.test.tsx` | ✅ `admin-lessons-workflow.cy.ts` | Full coverage |
| Lesson Search/Filter | ✅ | ✅ `search/route.test.ts` | ✅ `lesson-search-filter.cy.ts` | Full coverage |
| Lesson API | ✅ | ✅ `route.test.ts`, `handlers.test.ts`, `integration.test.ts` | ✅ | API coverage |
| Lesson Bulk Operations | ✅ | ✅ `bulk/route.test.ts` | ❌ | Bulk create |
| Lesson History | ✅ | ✅ `lesson-history.unit.test.ts` | ❌ | Change tracking |
| Lesson Stats | ✅ | ✅ `LessonStatsCharts.test.tsx` | ❌ | Dashboard charts |
| Student Filtering | ✅ | ✅ `student-filtering.test.ts` | ⚠️ | Role-based filtering |
| Admin Lessons API | ✅ | ✅ `admin/lessons/route.test.ts` | ✅ | Admin access |
| **Assignment Management** |
| Assignment List | ✅ | ✅ `AssignmentList.test.tsx`, `assignments/page.test.tsx` | ✅ `admin-assignments-workflow.cy.ts` | Full CRUD |
| Assignment Create/Edit | ✅ | ✅ `AssignmentForm.test.tsx` | ✅ `admin-assignments-workflow.cy.ts` | Full coverage |
| Assignment Completion | ✅ | ⚠️ | ✅ `student-assignment-completion.cy.ts` | Student workflow |
| Assignment History | ✅ | ✅ `assignment-history.unit.test.ts` | ❌ | Change tracking |
| **Dashboard** |
| Main Dashboard | ✅ | ✅ `Dashboard.test.tsx` | ✅ `admin-navigation.cy.ts` | Role-aware |
| Stats Grid | ✅ | ✅ `DashboardStatsGrid.test.tsx` | ⚠️ | Statistics overview |
| Admin Navigation | ✅ | ✅ `Header.test.tsx` | ✅ `admin-navigation.cy.ts` | Menu navigation |
| **Spotify Integration** |
| Spotify Search | ✅ | ✅ `search/route.test.ts` | ❌ | API search |
| Spotify Sync | ✅ | ✅ `sync/route.test.ts` | ❌ | Metadata sync |
| Spotify Features | ✅ | ✅ `features/route.test.ts` | ❌ | Audio features |
| Enhanced Search | ✅ | ✅ `enhanced-spotify-search.test.ts` | ❌ | Smart matching |
| **Google Calendar Integration** |
| Calendar Sync Modal | ✅ | ✅ `SyncCalendarModal.test.tsx` | ❌ | Import dialog |
| Calendar Events List | ✅ | ✅ `CalendarEventsList.test.tsx` | ❌ | Event display |
| Connect Google Button | ✅ | ✅ `ConnectGoogleButton.test.tsx` | ❌ | OAuth flow |
| Google Auth | ✅ | ✅ `google.test.ts`, `google/google.test.ts` | ❌ | Token handling |
| **Settings** |
| Settings UI | ✅ | ✅ `SettingsComponents.test.tsx` | ❌ | Settings page |
| Settings Hook | ✅ | ✅ `useSettings.test.tsx` | ❌ | State management |
| **UI Components** |
| Skeleton Loaders | ✅ | ✅ `skeleton.test.tsx` | ❌ | Loading states |
| Spinners | ✅ | ✅ `spinner.test.tsx` | ❌ | Loading indicators |
| History Timeline | ✅ | ✅ `HistoryTimeline.unit.test.tsx` | ❌ | Timeline display |
| System Logs | ✅ | ✅ `SystemLogs.unit.test.tsx` | ❌ | Debug view |
| **API & Infrastructure** |
| Bearer Token Auth | ✅ | ✅ `bearer-auth.test.ts` | ❌ | External API auth |
| Middleware | ✅ | ✅ `middleware.test.ts` | ✅ | Route protection |
| Supabase Config | ✅ | ✅ `credentials.test.ts` | ❌ | Connection setup |
| **Database Scripts** |
| Shadow Users | ✅ | ✅ `shadow-users.test.ts` | ❌ | User linking |
| Shadow User Linking | ✅ | ✅ `shadow-user-linking.test.ts` | ❌ | Account merge |
| Lesson Sync | ✅ | ✅ `sync-all-lessons.test.ts` | ❌ | Data sync |
| Orphan Cleanup | ✅ | ✅ `orphan-profile-cleanup.test.ts` | ❌ | Data cleanup |
| Drive Backup | ✅ | ✅ `upload-to-drive.test.ts` | ❌ | Backup system |
| **AI Features** |
| AI Providers | ✅ | ✅ `provider-factory.test.ts`, `openrouter.test.ts` | ❌ | OpenRouter/Ollama |
| AI Agents | ✅ | ✅ `agents.test.ts` | ❌ | Email, Lessons, Assignments |
| Rate Limiting | ✅ | ✅ `rate-limiter.test.ts` | ❌ | Usage control |
| **Email** |
| Email Sending | ✅ | ✅ `email.test.ts` | ❌ | Gmail SMTP |
| Email Templates | ✅ | ✅ `email.test.ts` | ❌ | Lesson/Report templates |
| **Cron Jobs** |
| Daily Report | ✅ | ✅ `daily-report.test.ts` | ❌ | Admin email report |

### E2E Test Suites Summary

| Suite | Location | Tests |
|-------|----------|-------|
| **Smoke Tests** | `cypress/e2e/smoke/` | `critical-path.cy.ts`, `api-endpoints.cy.ts` (28 REST API tests) |
| **Auth Tests** | `cypress/e2e/` | `auth-test.cy.ts` |
| **Admin Workflows** | `cypress/e2e/admin/` | 6 test files covering CRUD operations |
| **Integration Tests** | `cypress/e2e/integration/` | Auth, search, filtering |
| **Feature Tests** | `cypress/e2e/features/` | Student assignment completion |
| **Student Journey** | `cypress/e2e/` | `student-learning-journey.cy.ts` |

### Unit Test Summary

| Category | Test Files | Coverage Area |
|----------|------------|---------------|
| **Components** | 34 `.test.tsx` files | UI components, forms, lists |
| **API Routes** | 12 `.test.ts` files | API handlers, integration |
| **Lib/Services** | 14 `.test.ts` files | Core utilities, auth, integrations, AI, email |
| **History** | 4 `.unit.test.ts` files | Change tracking |
| **Database Scripts** | 5 `.test.ts` files | Data migration, sync |
| **AI System** | 4 `.test.ts` files | Providers, agents, rate limiting |
| **Email System** | 1 `.test.ts` file | SMTP, templates |
| **Cron Jobs** | 1 `.test.ts` file | Daily reports |

### Coverage Gaps (Needs Testing)

| Area | Type Needed | Priority |
|------|-------------|----------|
| Ollama Provider | Unit tests | Low |
| Google Calendar webhook | E2E tests | Low |
| Spotify sync E2E | E2E tests | Low |
| Settings page | E2E tests | Low |

---

*Last Updated: January 2026*
*Version: 0.65.0*
