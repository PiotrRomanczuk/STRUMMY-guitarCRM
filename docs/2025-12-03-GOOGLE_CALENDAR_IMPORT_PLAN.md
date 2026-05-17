# Google Calendar to Lessons Import - Implementation Plan

**Date:** 2025-11-27  
**Branch:** `feature/google-api-integration`  
**Goal:** Enable teachers to import Google Calendar events as Lessons, automatically matching students by email or creating shadow profiles for non-existing students.

---

## 1. Overview

### Current State
- Google OAuth and token management fully implemented in `lib/google.ts`
- Existing `syncLessonsFromCalendar` action in `app/actions/google-calendar.ts` (student-specific, limited)
- `lessons` table ready with `google_event_id` column for duplicate prevention
- `profiles` table allows `user_id: null` for shadow profiles

### Problem to Solve
Teachers have lessons scheduled in Google Calendar with students who:
1. Already exist in the CRM (matched by email)
2. Are ambiguous (multiple profiles with similar names/emails)
3. **Don't exist yet** (need to be created as shadow profiles)

### Solution: Shadow Profile Workflow
- Create student profiles with `user_id: null` and `email` set
- When students sign up with that email, automatically link their Auth account to the existing profile
- All imported lessons will immediately appear in the student's account upon signup

---

## 2. Database Schema Updates

### A. Add `google_event_id` to `lessons` table (if not exists)
```sql
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS google_event_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_lessons_google_event_id ON lessons(google_event_id);
```

### B. Create Database Trigger for Auto-Linking Profiles
```sql
-- Function to link new auth users to existing shadow profiles
CREATE OR REPLACE FUNCTION link_shadow_profile()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET user_id = NEW.id,
      updated_at = NOW()
  WHERE email = NEW.email
    AND user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION link_shadow_profile();
```

### C. Ensure RLS Policies Allow Shadow Profiles
```sql
-- Allow teachers to read/create shadow student profiles
CREATE POLICY "Teachers can create student profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Teachers can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('teacher', 'admin')
  )
);
```

---

## 3. Backend Implementation

### A. `lib/services/import-utils.ts` (New File)
Student matching and shadow profile creation utilities.

```typescript
import { createClient } from '@/lib/supabase/server';
import { TablesInsert } from '@/types/database.types';

export type MatchStatus = 'MATCHED' | 'AMBIGUOUS' | 'NONE';

export interface StudentMatch {
  status: MatchStatus;
  candidates: Array<{
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    user_id: string | null;
  }>;
}

/**
 * Match a Google Calendar attendee email to existing profiles
 */
export async function matchStudentByEmail(email: string): Promise<StudentMatch> {
  const supabase = await createClient();
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, firstName, lastName, user_id')
    .eq('email', email)
    .eq('isStudent', true);
  
  if (error || !profiles) {
    return { status: 'NONE', candidates: [] };
  }
  
  if (profiles.length === 0) {
    return { status: 'NONE', candidates: [] };
  }
  
  if (profiles.length === 1) {
    return { status: 'MATCHED', candidates: profiles };
  }
  
  return { status: 'AMBIGUOUS', candidates: profiles };
}

/**
 * Create a shadow student profile (no auth user yet)
 */
export async function createShadowStudent(
  email: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; profileId?: string; error?: string }> {
  const supabase = await createClient();
  
  const profileData: TablesInsert<'profiles'> = {
    email,
    firstName,
    lastName,
    isStudent: true,
    isTeacher: false,
    isAdmin: false,
    isActive: true,
    canEdit: false,
    user_id: null, // Shadow profile
  };
  
  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select('id')
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, profileId: data.id };
}
```

### B. `lib/google.ts` (Enhancement)
Update to fetch event descriptions and support custom date ranges.

```typescript
// Add to existing file
export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: Array<{ email: string; displayName?: string }>;
}

/**
 * Fetch calendar events for a date range (not student-specific)
 */
export async function getCalendarEventsInRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const client = await getGoogleClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: client });
  
  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });
  
  return (response.data.items || []) as CalendarEvent[];
}
```

### C. `app/actions/import-lessons.ts` (New File)
Server action to import selected events as lessons.

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { matchStudentByEmail, createShadowStudent } from '@/lib/services/import-utils';
import { TablesInsert } from '@/types/database.types';

export interface ImportEvent {
  googleEventId: string;
  title: string;
  notes?: string;
  startTime: string;
  attendeeEmail: string;
  attendeeName?: string;
  manualStudentId?: string; // For manual override
}

export async function importLessonsFromGoogle(events: ImportEvent[]) {
  const { user, isTeacher } = await getUserWithRolesSSR();
  
  if (!user || !isTeacher) {
    return { success: false, error: 'Unauthorized' };
  }
  
  const supabase = await createClient();
  const results = [];
  
  for (const event of events) {
    let studentId = event.manualStudentId;
    
    // If no manual override, try to match or create
    if (!studentId) {
      const match = await matchStudentByEmail(event.attendeeEmail);
      
      if (match.status === 'MATCHED') {
        studentId = match.candidates[0].id;
      } else if (match.status === 'NONE' && event.attendeeName) {
        // Create shadow student
        const [firstName, ...lastNameParts] = event.attendeeName.split(' ');
        const lastName = lastNameParts.join(' ') || '';
        
        const createResult = await createShadowStudent(
          event.attendeeEmail,
          firstName,
          lastName
        );
        
        if (!createResult.success) {
          results.push({ eventId: event.googleEventId, success: false, error: createResult.error });
          continue;
        }
        
        studentId = createResult.profileId!;
      } else {
        results.push({ eventId: event.googleEventId, success: false, error: 'Student match required' });
        continue;
      }
    }
    
    // Check for duplicate
    const { data: existing } = await supabase
      .from('lessons')
      .select('id')
      .eq('google_event_id', event.googleEventId)
      .single();
    
    if (existing) {
      results.push({ eventId: event.googleEventId, success: false, error: 'Already imported' });
      continue;
    }
    
    // Insert lesson
    const lessonData: TablesInsert<'lessons'> = {
      student_id: studentId,
      teacher_id: user.id,
      creator_user_id: user.id,
      title: event.title || 'Lesson',
      notes: event.notes,
      start_time: event.startTime,
      google_event_id: event.googleEventId,
      status: 'SCHEDULED',
    };
    
    const { error } = await supabase.from('lessons').insert(lessonData);
    
    if (error) {
      results.push({ eventId: event.googleEventId, success: false, error: error.message });
    } else {
      results.push({ eventId: event.googleEventId, success: true });
    }
  }
  
  return { success: true, results };
}
```

### D. `app/actions/student-management.ts` (New File)
Expose shadow student creation as a separate action for UI.

```typescript
'use server';

import { createShadowStudent } from '@/lib/services/import-utils';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';

export async function createStudentProfile(
  email: string,
  firstName: string,
  lastName: string
) {
  const { user, isTeacher } = await getUserWithRolesSSR();
  
  if (!user || !isTeacher) {
    return { success: false, error: 'Unauthorized' };
  }
  
  return await createShadowStudent(email, firstName, lastName);
}
```

---

## 4. Frontend Implementation

### A. `components/lessons/GoogleEventImporter.tsx` (New Component)
Main UI for fetching and importing events.

**Features:**
- Date range picker (lookback/lookahead)
- "Fetch Events" button
- Table showing:
  - Event summary/title
  - Date/time
  - Attendee name/email
  - Match status (✓ Matched | ⚠ Ambiguous | ➕ Create)
  - Student selector (dropdown or "Create" button)
  - Checkbox to select for import
- "Import Selected" button

**Pseudocode:**
```tsx
'use client';

import { useState } from 'react';
import { importLessonsFromGoogle } from '@/app/actions/import-lessons';
import { createStudentProfile } from '@/app/actions/student-management';

export function GoogleEventImporter() {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  
  // Fetch events from server action
  const handleFetch = async () => {
    // Call getCalendarEventsInRange via a server action wrapper
  };
  
  // Create shadow student and update row
  const handleCreateStudent = async (email: string, name: string) => {
    const [firstName, ...rest] = name.split(' ');
    const result = await createStudentProfile(email, firstName, rest.join(' '));
    // Update event row with new studentId
  };
  
  // Import selected events
  const handleImport = async () => {
    const toImport = events.filter(e => selected.has(e.id));
    await importLessonsFromGoogle(toImport);
  };
  
  return (
    <div>
      {/* Date range picker */}
      {/* Fetch button */}
      {/* Events table with match status and actions */}
      {/* Import button */}
    </div>
  );
}
```

### B. `app/dashboard/lessons/import/page.tsx` (New Page)
Route to access the importer.

```tsx
import { GoogleEventImporter } from '@/components/lessons/GoogleEventImporter';
import { getUserWithRolesSSR } from '@/lib/getUserWithRolesSSR';
import { redirect } from 'next/navigation';

export default async function ImportLessonsPage() {
  const { user, isTeacher } = await getUserWithRolesSSR();
  
  if (!user || !isTeacher) {
    redirect('/dashboard');
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Import Lessons from Google Calendar</h1>
      <GoogleEventImporter />
    </div>
  );
}
```

---

## 5. Testing Plan

### Unit Tests
- `lib/services/import-utils.ts`:
  - `matchStudentByEmail` with MATCHED, AMBIGUOUS, NONE cases
  - `createShadowStudent` success and error paths

### Integration Tests
- `app/actions/import-lessons.ts`:
  - Import with existing student
  - Import with shadow student creation
  - Import with manual student selection
  - Duplicate detection

### E2E Tests (Cypress)
- Full import flow:
  1. Login as teacher
  2. Navigate to import page
  3. Fetch events
  4. Create a shadow student
  5. Import selected events
  6. Verify lessons appear in dashboard

### Manual Testing
- Test auto-linking: Create shadow student, then sign up with that email and verify lessons appear

---

## 6. Migration Checklist

- [ ] Add `google_event_id` column to `lessons` table
- [ ] Create `link_shadow_profile()` trigger
- [ ] Update RLS policies for shadow profiles
- [ ] Implement `lib/services/import-utils.ts`
- [ ] Enhance `lib/google.ts` with `getCalendarEventsInRange`
- [ ] Create `app/actions/import-lessons.ts`
- [ ] Create `app/actions/student-management.ts`
- [ ] Build `components/lessons/GoogleEventImporter.tsx`
- [ ] Create `app/dashboard/lessons/import/page.tsx`
- [ ] Add navigation link to import page
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Write E2E tests
- [ ] Manual test auto-linking flow

---

## 7. Future Enhancements

- **Recurring Events:** Handle series expansion and sync
- **Two-Way Sync:** Update Google Calendar when lessons change in CRM
- **Conflict Detection:** Warn about overlapping lessons
- **Bulk Actions:** "Import All" with smart defaults
- **Student Invitations:** Auto-send signup emails to shadow students
- **Calendar Selection:** Support multiple calendars, not just primary

---

## 8. Security Considerations

- Ensure RLS policies prevent students from seeing other students' data
- Validate teacher role on all server actions
- Sanitize event data (summary/description) before storing
- Rate-limit import actions to prevent abuse
- Log all shadow student creations for audit trail

---

## Notes

- Shadow profiles use `user_id: null` and are linked automatically on signup via database trigger
- The trigger runs on `auth.users` insert, so it works for any signup method (email, OAuth, etc.)
- Teachers can safely create shadow students without worrying about Auth account conflicts
- All imported lessons will "magically" appear for students once they sign up with the matching email
