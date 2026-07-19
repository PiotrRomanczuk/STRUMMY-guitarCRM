# User Guides

This guide covers the features and workflows for all user roles in Guitar CRM.

---

# Part 1: Admin & Teacher Guide

> **Note**: Currently, teachers share the same dashboard as admins. The owner is the only teacher and needs full admin functionality.

## 1. Dashboard Overview (`/dashboard`)

The main landing page provides a high-level view of the system.

### Key Sections

| Section | Description |
|---------|-------------|
| **Key Metrics** | Total users, students, teachers, songs, lessons |
| **Recent Activity** | Latest actions in the system |
| **Quick Actions** | Fast access to common tasks |
| **Today's Agenda** | Scheduled lessons for today |
| **Notifications** | System alerts and action items |

### Mobile Experience
- ✅ Navigation collapses to hamburger menu
- ✅ Stats cards stack vertically
- ✅ All buttons are touch-friendly (44px+ height)

---

## 2. User Management (`/dashboard/users`)

Manage all users in the system.

### Features

| Feature | Description |
|---------|-------------|
| **List Users** | Searchable, filterable list of all users |
| **User Details** | View profile, contact info, role |
| **Role Management** | Assign/revoke Admin, Teacher, Student roles |
| **Create Users** | Add new teachers or students |
| **Shadow Users** | Create placeholder accounts for students |

### Workflow: Adding a New Student

1. Navigate to `/dashboard/users`
2. Click **"Add User"**
3. Fill in student details (name, email)
4. Toggle **"Is Student"** role
5. Save

---

## 3. Song Library (`/dashboard/songs`)

Central repository for all music resources.

### Features

| Feature | Description |
|---------|-------------|
| **Browse Library** | Search by title, artist, key, difficulty |
| **Add Songs** | Create with metadata (Title, Artist, Key, Level) |
| **Edit Songs** | Update details, add links |
| **Spotify Integration** | Search and import from Spotify |
| **Attachments** | Add YouTube, Ultimate Guitar, PDF links |

### Song Metadata

| Field | Description |
|-------|-------------|
| Title | Song name |
| Author/Artist | Performer name |
| Key | Musical key (C, Am, G, etc.) |
| Level | Beginner, Intermediate, Advanced |
| YouTube | Video tutorial link |
| Ultimate Guitar | Chord/tab link |
| Chords | Chord progression |
| Capo | Capo position (0-20) |

---

## 4. Lesson Management (`/dashboard/lessons`)

Schedule and track lessons.

### Features

| Feature | Description |
|---------|-------------|
| **Calendar/List View** | View scheduled lessons |
| **Create Lesson** | Schedule new lesson with student |
| **Lesson Details** | Add notes, assign songs |
| **Status Tracking** | Scheduled, Completed, Cancelled |
| **History** | Automatic change tracking |

### Workflow: Scheduling a Lesson

1. Navigate to `/dashboard/lessons`
2. Click **"New Lesson"**
3. Select student from dropdown
4. Set date and time
5. Add optional title/notes
6. Save

### Workflow: Post-Lesson

1. Open the lesson detail
2. Add lesson notes
3. Assign songs worked on
4. Update song statuses (In Progress, Mastered)
5. Create follow-up assignment if needed
6. Mark lesson as Completed

---

## 5. Assignments (`/dashboard/assignments`)

Manage homework and practice tasks.

### Features

| Feature | Description |
|---------|-------------|
| **Create Assignment** | Assign tasks to students |
| **Link Content** | Attach songs or lessons |
| **Track Progress** | Monitor completion status |
| **Templates** | Reuse common assignment types |

### Assignment Statuses

| Status | Description |
|--------|-------------|
| Not Started | New assignment |
| In Progress | Student working on it |
| Completed | Student finished |
| Overdue | Past due date |
| Cancelled | No longer required |

---

## 6. Settings (`/dashboard/settings`)

Configure account and system preferences.

### Sections

| Section | Description |
|---------|-------------|
| **Profile** | Update contact information |
| **API Keys** | Generate bearer tokens for external apps |
| **Integrations** | Connect Google Calendar |

---

## 7. AI Features

AI assistance is available throughout the dashboard.

### Available AI Tools

| Tool | Location | Purpose |
|------|----------|---------|
| **AI Assistant** | `/dashboard/ai` | General Q&A, content drafting |
| **Email Draft** | Dashboard | Generate student/parent emails |
| **Lesson Notes** | Lesson form | Generate structured notes |
| **Assignments** | Assignment form | Create personalized tasks |
| **Insights** | Dashboard | Business intelligence |

---

# Part 2: Student Guide

## 1. Dashboard Overview (`/dashboard`)

Your personal command center for learning.

### Key Sections

| Section | Description |
|---------|-------------|
| **Welcome** | Personalized greeting |
| **Next Lesson** | Upcoming scheduled lesson |
| **My Songs** | Songs you're learning |
| **Assignments** | Pending practice tasks |
| **Recent Activity** | Your latest progress |

---

## 2. My Lessons (`/dashboard/lessons`)

View your lesson schedule and history.

### What You Can See

- **Upcoming Lessons**: Date, time, teacher
- **Past Lessons**: History with notes
- **Lesson Details**: Teacher feedback, songs covered

### Actions

- View lesson details
- Read teacher notes
- See assigned songs

> **Note**: Students cannot edit or delete lessons.

---

## 3. My Songs (`/dashboard/songs`)

Access your assigned songs and learning materials.

### Song Information

| Field | Description |
|-------|-------------|
| Title & Artist | Song identification |
| Difficulty | Beginner/Intermediate/Advanced |
| Status | To Learn, Learning, Practicing, Mastered |
| Resources | YouTube, tabs, chords |

### Song Statuses

| Status | Meaning |
|--------|---------|
| To Learn | Not started yet |
| Started | Beginning to learn |
| Remembered | Can play basic version |
| With Author | Playing along with recording |
| Mastered | Fully learned |

---

## 4. My Assignments (`/dashboard/assignments`)

Track your homework and practice tasks.

### Assignment Details

- **Title**: What to practice
- **Description**: Detailed instructions
- **Due Date**: When it's due
- **Status**: Your progress

### Actions

- View assignment details
- Mark as complete (if enabled)
- Access linked songs/lessons

---

## 5. Settings (`/dashboard/settings`)

Manage your account preferences.

### Options

- Update profile information
- Change password
- API keys for widgets

---

## Mobile Experience

The student dashboard is optimized for mobile devices:

- ✅ Single-column layout on phones
- ✅ Touch-friendly buttons and controls
- ✅ Readable text without zooming
- ✅ Native date/time pickers
- ✅ Full-width media players

### Target Device: iPhone 17 (393pt width)

All components tested for:
- Proper padding (16px sides)
- Minimum 16px font size
- 44x44px touch targets
- Correct flex wrapping

---

# Summary Checklist

## For Admins/Teachers

- [ ] All students created with correct roles
- [ ] Song library populated (10-20 songs minimum)
- [ ] Next week's lessons scheduled
- [ ] Each active student has assignments

## For Students

- [ ] Can access dashboard
- [ ] Can view upcoming lessons
- [ ] Can access assigned songs
- [ ] Can track assignment progress
