# Admin & Teacher Journey Guide

This guide outlines the recommended workflow for administrators and teachers to successfully manage the Guitar CRM application.

## Phase 1: Content & Library Building (Teacher Focus)

Before scheduling lessons, you need a library of materials to teach.

### 1. Build the Song Library (`/dashboard/songs`)

* **Add Songs:** Click "Add Song" to populate your database.
* **Details:** Include Title, Artist, Key, and Difficulty Level (Beginner, Intermediate, Advanced).
* **Resources:** Attach links to chords, audio files, or Ultimate Guitar tabs.
* *Goal:* Create a diverse library so you can easily assign material during lessons.

## Phase 2: Daily Operations (Teacher Workflow)

This is your day-to-day workflow for managing students.

### 1. Schedule Lessons (`/dashboard/lessons`)

* **Create Lesson:** Use the "New Lesson" button for manual scheduling.
* **Select Student:** Choose from your active student list.
* **Set Date/Time:** Schedule the session.
* **Lesson Numbering:** The system automatically tracks lesson numbers per student (e.g., "Lesson #5 with John").

### 2. Google Calendar Sync (`/dashboard/lessons/import`)

* **Import Tool:** Use the "Import from Google Calendar" feature to sync your existing schedule.
* **Smart Matching:** The system automatically matches events to students by email.
* **Shadow Profiles:** If a student doesn't exist yet, a "shadow profile" is created automatically. When they eventually sign up, their lesson history will be waiting for them.

### 3. Conducting a Lesson

* **Lesson Notes:** Open the lesson detail view during the session. Record notes on what was covered.
* **Assign Songs:** Use the "Songs" tab in the lesson detail to link specific songs from your library to this lesson.
* **Track Progress:** Mark songs as "In Progress" or "Completed" as the student masters them.

### 4. Assign Homework (`/dashboard/assignments`)

* **Create Assignment:** Create specific tasks (e.g., "Practice C Major Scale", "Learn Intro to Wonderwall").
* **Set Due Date:** Give students a target date.
* **Priority:** Mark urgent tasks with High Priority.
* **Link to Lesson:** Optionally link the assignment to a specific lesson for context.

## Phase 3: Monitoring & Growth

### 1. Track Student Progress

* View the **Student Dashboard** (if you have a student view) or individual student profiles to see their completed lessons and assignments.
* Monitor overdue assignments in the Assignments list (highlighted in red).

### 2. Maintenance

* **Archive Users:** Deactivate students who have stopped taking lessons to keep your active list clean.
* **Update Songs:** Regularly refine song data with better tabs or new resources.

## Phase 4: System Setup & Onboarding (Admin Focus)

Your first goal is to populate the system with the necessary people and permissions.

### 1. Access the Admin Dashboard

* Navigate to `/dashboard` to see the system overview (Total Users, Teachers, Students, Songs).
* Use the **Quick Actions** cards for fast navigation.

### 2. User Management (`/dashboard/users`)

* **Create Teachers:** Create accounts for your staff. Ensure you toggle the `isTeacher` role flag.
* **Create Students:** Create accounts for your students. Ensure you toggle the `isStudent` role flag.
* *Tip:* Use the "Recent Users" section on the dashboard to verify new registrations.

### 3. System Configuration (`/dashboard/settings`)

* Verify your own profile settings.
* (Future) Configure system-wide settings as they become available.

## Summary Checklist for Success

* [ ] **Admin:** Are all my teachers and students created with correct roles?
* [ ] **Library:** Do I have at least 10-20 common songs added with keys and difficulty?
* [ ] **Schedule:** Are next week's lessons scheduled in the system?
* [ ] **Assignments:** Does every active student have at least one open assignment?
