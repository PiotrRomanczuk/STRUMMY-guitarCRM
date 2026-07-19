# Local Seeding Scripts

Comprehensive setup scripts for populating the development database with test users and sample data.

## 📋 Files Overview

| File | Type | Purpose |
|------|------|---------|
| `seed-all.sh` | Bash | **Master orchestrator** - Runs all seeding in correct order |
| `seed-dev-users-via-api.js` | JavaScript | Creates dev users with roles via Supabase Auth API |
| `update-dev-passwords-via-api.js` | JavaScript | Updates passwords for existing dev users |
| `seed-db.sh` | Bash | Seeds database with sample data (songs, lessons, etc.) |
| `seed-assignments.ts` | TypeScript | Generates sample assignments (optional advanced seeding) |
| `CREDENTIALS_REFERENCE.md` | Documentation | Complete guide to all dev user credentials |
| `QUALITY_FIXES.md` | Documentation | Quality improvements and fixes applied |

## 🚀 Quick Start

### Prerequisites

- Supabase running locally: `npm run setup:db`
- Node.js and npm available
- `.env.local` configured with Supabase credentials

### Complete Setup

```bash
# 1. Start Supabase (if not already running)
npm run setup:db

# 2. Seed everything
bash scripts/database/seeding/local/seed-all.sh

# 3. Start the app
npm run dev

# 4. Login with any dev credential (see CREDENTIALS_REFERENCE.md)
```

## 📚 Development Credentials

All users have test credentials in the format: `test123_<role>`

**Admin User:**

```bash
Email:    p.romanczuk@gmail.com
Password: test123_admin
```

**Teacher User:**

```bash
Email:    teacher@example.com
Password: test123_teacher
```

**Student Users:**

```bash
Email:    student@example.com
Password: test123_student

Email:    teststudent1@example.com
Password: test123_student

Email:    teststudent2@example.com
Password: test123_student

Email:    teststudent3@example.com
Password: test123_student
```

See `CREDENTIALS_REFERENCE.md` for complete details including role flags and permissions.

## 🔄 Individual Scripts

### seed-all.sh (Recommended)

Orchestrates all seeding operations in the correct sequence:

```bash
bash scripts/database/seeding/local/seed-all.sh
```

**What it does:**

1. Verifies Supabase is running
2. Creates dev users with roles
3. Seeds database with sample data
4. Displays verification summary

### seed-dev-users-via-api.js

Creates development users via Supabase Auth REST API:

```bash
cd /path/to/strummy
node scripts/database/seeding/local/seed-dev-users-via-api.js
```

**Creates:**

- 1 Admin user (is_admin + is_teacher)
- 1 Teacher user
- 4 Student users

**Notes:**

- Creates profiles synchronized with auth.users
- Sets role flags (is_admin, is_teacher, is_student)
- Handles duplicate users gracefully

### update-dev-passwords-via-api.js

Updates passwords for existing users (useful if seeding fails midway):

```bash
node scripts/database/seeding/local/update-dev-passwords-via-api.js
```

### seed-db.sh

Populates database with sample songs, lessons, and relationships:

```bash
bash scripts/database/seeding/local/seed-db.sh
```

### seed-assignments.ts

Advanced: Generates realistic assignment data for testing assignment features:

```bash
# Requires ts-node
npx ts-node scripts/database/seeding/local/seed-assignments.ts
```

## ✅ Quality & Validation

All scripts pass quality checks:

```bash
# Run linting
npm run lint -- scripts/database/seeding/local/

# Check TypeScript (seed-assignments.ts)
npx tsc --noEmit scripts/database/seeding/local/seed-assignments.ts

# Full quality check
npm run quality
```

See `QUALITY_FIXES.md` for details on improvements made.

## 🔧 Troubleshooting

### Supabase not running?

```bash
npm run setup:db
```

### Users not created?

```bash
# Check env variables
cat .env.local | grep SUPABASE

# Verify Supabase health
curl http://localhost:54321/health

# Check Supabase logs
docker logs supabase_auth  # Or other container
```

### Can't login?

1. Verify user exists in Supabase Studio (<http://localhost:54323>)
2. Check email spelling (case-sensitive)
3. Verify password matches exactly
4. Ensure profile exists on `profiles` table

### Reset everything

```bash
# Stop and remove Supabase
npm run db:stop
rm -rf supabase/.branches

# Fresh start
npm run setup:db
bash scripts/database/seeding/local/seed-all.sh
```

## 📝 Adding New Test Users

### Add to seed-dev-users-via-api.js

```javascript
{
  email: 'newtester@example.com',
  password: 'test123_newuser',
  firstName: 'New',
  lastName: 'Tester',
  notes: 'Custom test user',
  is_admin: false,
  is_teacher: true,
  is_student: true,
}
```

### Add to update-dev-passwords-via-api.js

```javascript
{
  id: 'generated-uuid-here',
  email: 'newtester@example.com',
  password: 'test123_newuser',
}
```

### Reseed

```bash
bash scripts/database/seeding/local/seed-all.sh
```

## 🔐 Security Notes

⚠️ **IMPORTANT:**

- These credentials are for **LOCAL DEVELOPMENT ONLY**
- Never use in production
- Never commit actual production credentials to this repo
- Service role key in code is only for local dev (safe to share in open source context)
- Use environment variables for all sensitive data in production

## 📖 Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

For local development, these are provided by Supabase CLI.

## 🧪 Testing Different Roles

After seeding, test role-based access:

```bash
# Test as admin (full access)
# Login: p.romanczuk@gmail.com / test123_admin

# Test as teacher (can manage students)
# Login: teacher@example.com / test123_teacher

# Test as student (limited access)
# Login: student@example.com / test123_student

# Test multiple roles (admin + teacher)
# Login: p.romanczuk@gmail.com / test123_admin
```

## 📊 Verification

After seeding, verify data in Supabase Studio:

```bash
# Open Supabase Studio
open http://localhost:54323

# Or query directly
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c \
  "SELECT email, is_admin, is_teacher, is_student FROM profiles ORDER BY email;"
```

## 🆘 Getting Help

1. Check `CREDENTIALS_REFERENCE.md` for credential details
2. Check `QUALITY_FIXES.md` for recent changes
3. Review `.env.local` - ensure all vars are set
4. Verify Supabase is running: `docker ps`
5. Check application logs: `npm run dev`

## 📝 Recent Changes

**v1.1 (Nov 10, 2025):**

- ✅ Fixed seed-assignments.ts - removed faker dependency, uses Math.random() instead
- ✅ Added seed-all.sh orchestrator script
- ✅ Created CREDENTIALS_REFERENCE.md with comprehensive documentation
- ✅ All scripts pass ESLint and TypeScript checks
- ✅ Improved error handling and logging

**v1.0 (Initial):**

- Basic seeding infrastructure
- Dev user creation and management
