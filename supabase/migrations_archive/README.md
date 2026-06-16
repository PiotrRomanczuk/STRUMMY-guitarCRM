# Guitar CRM - Optimized Database Schema v2

This directory contains a clean, optimized database schema designed from scratch based on learnings from the original migrations.

## Key Improvements Over Original Schema

### 1. Simplified Identity Model
- `profiles.id` = `auth.users.id` (same UUID)
- Direct RLS comparisons: `id = auth.uid()` works everywhere
- No separate `user_id` column confusion

### 2. No Redundant Role System
- Removed `user_roles` junction table
- Roles stored only as boolean flags in `profiles`
- Single source of truth, no sync triggers

### 3. Unified Audit Log
- Single partitioned `audit_log` table instead of 4 separate history tables
- Delta-only storage (not full record snapshots)
- Monthly partitioning for efficient data retention
- Easy archival with `archive_old_audit_partitions()` function

### 4. Separate Pending Students
- Shadow users moved to `pending_students` table
- Clean separation from authenticated users
- Automatic migration on signup via auth trigger

### 5. Optimized RLS Policies
- Cached role-checking functions
- No redundant subqueries
- Removed insecure "all authenticated" policy from `lesson_songs`

### 6. Consistent Naming
- All indexes: `ix_{table}_{columns}`
- All triggers: `tr_{table}_{purpose}`
- All constraints: `ck_{table}_{purpose}` or `uq_{table}_{columns}`

### 7. Better Data Types
- Custom domains for bounded text (short_text, medium_text)
- Email validation domain
- URL validation domain
- Percentage and positive_int domains

### 8. Composite Indexes
- Pre-created indexes for common dashboard queries
- Partial indexes for soft-deleted records
- Status-based filtering indexes

### 9. Materialized Views
- `mv_dashboard_stats` for pre-computed dashboard metrics
- `mv_song_popularity` for song recommendations
- Concurrent refresh support

### 10. Explicit Grants
- All permissions explicitly granted
- Clear separation between authenticated and service_role

## Migration Files

| File | Purpose |
|------|---------|
| 001_extensions.sql | Enable pg_trgm extension |
| 002_domains.sql | Custom data types |
| 003_enums.sql | All enum types |
| 004_functions_base.sql | Generic utility functions |
| 005_table_profiles.sql | User profiles |
| 006_table_pending_students.sql | Shadow users |
| 007_table_songs.sql | Song library |
| 008_table_lessons.sql | Lessons |
| 009_table_lesson_songs.sql | Lesson-song junction |
| 010_table_assignments.sql | Assignments |
| 011_table_assignment_templates.sql | Assignment templates |
| 012_table_practice.sql | Practice sessions & progress |
| 013_table_integrations.sql | API keys, OAuth, webhooks |
| 014_table_spotify.sql | Spotify matches |
| 015_table_ai.sql | AI conversations & usage |
| 016_table_audit.sql | Unified audit log (partitioned) |
| 017_views.sql | Regular views |
| 018_materialized_views.sql | Materialized views |
| 019_functions_business.sql | Business logic functions |
| 020_triggers.sql | All triggers |
| 021_rls_enable.sql | Enable RLS on all tables |
| 022_rls_policies.sql | All RLS policies |
| 023_grants.sql | Explicit permissions |
| 024_storage.sql | Storage bucket policies |
| 025_auth_trigger.sql | Auth.users signup handler |
| 026_seed.sql | Initial seed data |

## Usage

### Fresh Installation
```bash
# Reset database and apply all migrations
supabase db reset

# Or apply migrations manually
supabase migration up
```

### Refresh Materialized Views
```sql
-- Dashboard stats (run every 5-15 minutes)
SELECT refresh_dashboard_stats();

-- Song popularity (run hourly)
SELECT refresh_song_popularity();
```

### Create Future Audit Partitions
```sql
-- Create partition for January 2027
SELECT create_audit_log_partition(2027, 1);
```

### Archive Old Audit Data
```sql
-- Archive partitions older than 12 months
SELECT archive_old_audit_partitions(12);
```

## Migration from Original Schema

To migrate from the original schema to this optimized version:

1. Export existing data
2. Apply new migrations to fresh database
3. Transform and import data with ID mapping
4. Update application queries as needed

Key changes requiring application updates:
- `profiles.user_id` removed - use `profiles.id` directly
- `user_roles` table removed - use `profiles.is_*` flags
- History tables consolidated into `audit_log`
- Shadow users moved to `pending_students`
