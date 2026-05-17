# Student Dashboard Implementation Plan

## Goal

Create a dedicated dashboard view for students featuring three specific cards (Last Lesson, Assignments, Last 5 Songs) and excluding the Google Calendar integration.

## 1. Backend & Data Fetching

Create a dedicated Server Action to retrieve the specific data for the student dashboard.

- **File:** `app/actions/student/dashboard.ts`
- **Function:** `getStudentDashboardData()`
  - **Last Lesson:** Fetch the most recent lesson from `lessons` table where `student_id` matches the user and `scheduled_at` is in the past.
  - **Assignments:** Fetch active/pending assignments from `assignments` table.
  - **Last 5 Songs:** Fetch the last 5 unique songs from `lesson_songs` joined with `lessons` (to get the date) and `songs` (to get details).

## 2. UI Components

Create new, dedicated components for the student dashboard in `components/dashboard/student/`.

- **`LastLessonCard.tsx`**:
  - Displays the most recent lesson's title, date, and notes/summary.
  - Includes a "View Details" button linking to the lesson page.
- **`AssignmentsCard.tsx`**:
  - Lists pending assignments with due dates.
  - Shows a status badge (e.g., "Pending", "Overdue").
- **`RecentSongsCard.tsx`**:
  - Lists the last 5 songs practiced/assigned.
  - Displays Song Title and Artist.
- **`StudentDashboardClient.tsx`**:
  - The main container component for the student view.
  - Arranges the above cards in a responsive grid.
  - **Excludes Google Calendar component.**

## 3. Integration

Update the main dashboard page to conditionally render the student view.

- **File:** `app/dashboard/page.tsx`
  - Modify server-side logic to check for `isStudent`.
  - If `isStudent` (and not `isAdmin`), render `StudentDashboardClient`.
  - Pass fetched data to the client component.

## 4. Cleanup

- Review and potentially remove unused components in `components/dashboard/student/` if they are replaced by the new implementation.
