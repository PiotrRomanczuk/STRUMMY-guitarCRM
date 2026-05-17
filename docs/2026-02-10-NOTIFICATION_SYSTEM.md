# Notification System - Developer Documentation

Comprehensive guide to Strummy's email notification system for developers.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [How to Add a New Notification Type](#how-to-add-a-new-notification-type)
3. [Email Template Creation Guide](#email-template-creation-guide)
4. [Testing Guidelines](#testing-guidelines)
5. [Database Schema](#database-schema)
6. [Cron Jobs](#cron-jobs)
7. [Troubleshooting](#troubleshooting)
8. [Configuration](#configuration)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     NOTIFICATION SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   DATABASE   │    │   SERVICE    │    │   TEMPLATES  │     │
│  │              │    │              │    │              │     │
│  │ - Preferences│◄───┤ Notification │◄───┤ Email HTML   │     │
│  │ - Log        │    │ Service      │    │ Renderer     │     │
│  │ - Queue      │    │              │    │              │     │
│  └──────────────┘    └──────────────┘    └──────────────┘     │
│         ▲                   ▲                                   │
│         │                   │                                   │
│  ┌──────────────┐    ┌──────────────┐                         │
│  │   TRIGGERS   │    │  CRON JOBS   │                         │
│  │              │    │              │                         │
│  │ - Lesson     │───►│ - Queue      │                         │
│  │   cancelled  │    │   processor  │                         │
│  │ - Song       │    │ - Reminders  │                         │
│  │   mastered   │    │ - Digests    │                         │
│  └──────────────┘    └──────────────┘                         │
│                                                                 │
│  ┌────────────────────────────────────────────────────┐        │
│  │             ERROR HANDLING & RETRY                 │        │
│  │  - Exponential backoff (1m, 5m, 30m, 2h, 24h)    │        │
│  │  - Rate limiting (100/hour/user, 1000/hour/system)│        │
│  │  - Bounce handling (auto-disable after 3 bounces) │        │
│  └────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Trigger Event** → Database trigger or Server Action creates queue entry
2. **Queue Entry** → Stored in `notification_queue` with priority and schedule
3. **Cron Job** → Every 15 minutes, fetches pending notifications
4. **Preference Check** → Verifies user has notification type enabled
5. **Rate Limiting** → Checks user and system-wide rate limits
6. **Template Rendering** → Generates HTML email from template
7. **Send Email** → SMTP send via Gmail
8. **Log Result** → Status recorded in `notification_log`
9. **Retry on Failure** → Exponential backoff for failed sends

### Error Handling Flow

```
Send Attempt
    ├─ Success → Update log status to 'sent'
    └─ Failure → Update log status to 'failed'
         ├─ Retry count < 5 → Schedule retry with backoff
         │   ├─ Retry 1: Wait 1 minute
         │   ├─ Retry 2: Wait 5 minutes
         │   ├─ Retry 3: Wait 30 minutes
         │   ├─ Retry 4: Wait 2 hours
         │   └─ Retry 5: Wait 24 hours
         └─ Retry count ≥ 5 → Move to dead letter (status: 'bounced')

Bounce Detection
    └─ 3 consecutive bounces → Auto-disable all notifications for user
```

---

## How to Add a New Notification Type

Follow these steps to add a new notification type to the system.

### Step 1: Add Enum to Database Migration

Create a new migration file or append to existing notification migration:

```sql
-- Add new notification type to enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_notification_type';
```

**Migration file location:** `/supabase/migrations/`

**Example:**
```sql
-- supabase/migrations/034_add_new_notification_type.sql
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'practice_streak_reminder';
```

Run migration:
```bash
npm run setup:db
```

### Step 2: Update TypeScript Types

Add the new type to `/types/notifications.ts`:

```typescript
// In NotificationType union type
export type NotificationType =
  // ... existing types
  | 'new_notification_type';

// Add to NOTIFICATION_CATEGORIES
export const NOTIFICATION_CATEGORIES = {
  // ... existing categories
  customCategory: [
    'new_notification_type',
  ] as const,
} as const;

// Add to NOTIFICATION_TYPE_INFO
export const NOTIFICATION_TYPE_INFO: Record<NotificationType, NotificationTypeInfo> = {
  // ... existing info
  new_notification_type: {
    label: 'Display Name',
    description: 'User-friendly description shown in settings',
    defaultEnabled: true, // or false
    category: 'customCategory',
  },
};
```

### Step 3: Create Email Template

Create a new template in `/lib/email/templates/`:

```typescript
// lib/email/templates/new-notification.ts
import {
  generateBaseEmailHtml,
  createGreeting,
  createSectionHeading,
  createParagraph,
  createCardSection,
  createDetailRow,
} from './base-template';

export interface NewNotificationData {
  recipientName: string;
  // ... other data fields
}

export function generateNewNotificationEmail(data: NewNotificationData): string {
  const { recipientName, ... } = data;

  const bodyContent = `
    ${createGreeting(recipientName)}
    ${createSectionHeading('Main Heading')}
    ${createParagraph('Email body content...')}
    ${createCardSection(`
      ${createDetailRow('Label', 'Value')}
    `)}
  `;

  return generateBaseEmailHtml({
    subject: 'Email Subject',
    preheader: 'Preview text shown in inbox',
    bodyContent,
    footerNote: 'Optional footer note',
    ctaButton: {
      text: 'Call to Action',
      url: 'https://example.com/action',
    },
  });
}
```

### Step 4: Add Template to Notification Service

Update `/lib/services/notification-service.ts`:

```typescript
// 1. Import the template
import { generateNewNotificationEmail } from '@/lib/email/templates/new-notification';

// 2. Add subject mapping in getNotificationSubject()
function getNotificationSubject(
  type: NotificationType,
  templateData: Record<string, unknown>
): string {
  const subjectMap: Record<NotificationType, (data: Record<string, unknown>) => string> = {
    // ... existing mappings
    new_notification_type: (data) => `Subject with ${data.field}`,
  };
  // ... rest of function
}

// 3. Add template rendering in getNotificationHtml()
async function getNotificationHtml(
  type: NotificationType,
  templateData: Record<string, unknown>,
  recipient: { full_name: string | null; email: string }
): Promise<string> {
  // ... existing code

  switch (type) {
    // ... existing cases
    case 'new_notification_type':
      return generateNewNotificationEmail(templateData as NewNotificationData);
    default:
      // fallback template
  }
}
```

### Step 5: Queue Notifications (Choose One)

#### Option A: Database Trigger (Automatic)

Create a trigger function in a migration:

```sql
-- supabase/migrations/035_trigger_new_notification.sql
CREATE OR REPLACE FUNCTION tr_notify_new_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_template_data JSONB;
BEGIN
  -- Build template data
  v_template_data := jsonb_build_object(
    'recipientName', NEW.full_name,
    'field1', NEW.field1
  );

  -- Queue notification
  INSERT INTO notification_queue (
    notification_type,
    recipient_user_id,
    template_data,
    scheduled_for,
    priority,
    entity_type,
    entity_id
  ) VALUES (
    'new_notification_type',
    NEW.user_id,
    v_template_data,
    now(), -- Send immediately (or use NOW() + INTERVAL '1 hour')
    5, -- Priority: 1-10 (10 = highest)
    'entity_name',
    NEW.id
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_table_notify_event
  AFTER INSERT OR UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION tr_notify_new_event();
```

#### Option B: Manual Queue from Server Action

```typescript
// app/actions/some-action.ts
import { queueNotification } from '@/lib/services/notification-service';

export async function performAction() {
  // ... perform action

  // Queue notification
  await queueNotification({
    type: 'new_notification_type',
    recipientUserId: userId,
    templateData: {
      recipientName: user.full_name,
      field1: value1,
    },
    priority: 8, // High priority
    scheduledFor: new Date(Date.now() + 60000), // 1 minute from now
    entityType: 'entity_name',
    entityId: entityId,
  });
}
```

### Step 6: Update Default Preferences

Update the `initialize_notification_preferences()` function in migration `032_notification_system.sql`:

```sql
CREATE OR REPLACE FUNCTION initialize_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_types TEXT[] := ARRAY[
        -- ... existing types
        'new_notification_type'
    ];
    -- ... rest of function
```

### Step 7: Test

1. **Unit test the template:**
   ```bash
   npm test -- templates/new-notification
   ```

2. **Test preference initialization:**
   - Create a new user
   - Verify preference exists in `notification_preferences`

3. **Test queue and send:**
   - Trigger the notification
   - Check `notification_queue` for entry
   - Run cron manually: `curl http://localhost:3000/api/cron/process-notification-queue`
   - Verify in `notification_log`

---

## Email Template Creation Guide

### Using the Base Template

All email templates should use `generateBaseEmailHtml()` from `/lib/email/templates/base-template.ts`.

```typescript
import { generateBaseEmailHtml } from './base-template';

export function generateMyEmail(data: MyData): string {
  return generateBaseEmailHtml({
    subject: 'Email Subject',           // Required
    preheader: 'Preview text...',       // Optional, shown in inbox preview
    bodyContent: '<html>...</html>',    // Required, main email body
    footerNote: 'Additional footer',    // Optional
    ctaButton: {                        // Optional
      text: 'Click Here',
      url: 'https://example.com',
    },
    recipientEmail: data.email,         // Optional, for unsubscribe
    notificationType: 'lesson_reminder',// Optional, for unsubscribe
  });
}
```

### Available Helper Functions

The base template provides helper functions for common patterns:

#### 1. Text Elements

```typescript
// Greeting
createGreeting('John')
// → "Hi John,"

// Section heading (h2)
createSectionHeading('Lesson Details')

// Subsection heading (h3)
createSubsectionHeading('Songs Practiced')

// Paragraph
createParagraph('This is body text with proper spacing.')

// Divider
createDivider()
```

#### 2. Card Section

```typescript
createCardSection(`
  <h3>Card Title</h3>
  <p>Card content goes here</p>
`)
// → Gray/dark background card with padding and border-radius
```

#### 3. Detail Rows

```typescript
createDetailRow('Lesson Date', 'Monday, January 15, 2025')
createDetailRow('Time', '3:00 PM')
// → Label (uppercase, small, gray) + Value (larger, bold, dark)
```

#### 4. Status Badges

```typescript
createStatusBadge('Completed', 'success')  // Green
createStatusBadge('Overdue', 'warning')    // Orange
createStatusBadge('Pending', 'info')       // Blue
createStatusBadge('Cancelled', 'default')  // Gray
```

### Template Example

```typescript
import {
  generateBaseEmailHtml,
  createGreeting,
  createSectionHeading,
  createParagraph,
  createCardSection,
  createDetailRow,
  createStatusBadge,
  createDivider,
} from './base-template';

export interface LessonReminderData {
  studentName: string;
  lessonDate: string;
  lessonTime: string;
  teacherName: string;
}

export function generateLessonReminderEmail(data: LessonReminderData): string {
  const { studentName, lessonDate, lessonTime, teacherName } = data;

  const bodyContent = `
    ${createGreeting(studentName)}

    ${createSectionHeading('Upcoming Lesson Reminder')}

    ${createParagraph(
      'You have a guitar lesson scheduled tomorrow. We look forward to seeing you!'
    )}

    ${createCardSection(`
      ${createDetailRow('Date', lessonDate)}
      ${createDetailRow('Time', lessonTime)}
      ${createDetailRow('Teacher', teacherName)}
      ${createDetailRow('Status', createStatusBadge('Confirmed', 'success'))}
    `)}

    ${createDivider()}

    ${createParagraph(
      'If you need to reschedule, please contact your teacher as soon as possible.'
    )}
  `;

  return generateBaseEmailHtml({
    subject: 'Reminder: Guitar Lesson Tomorrow',
    preheader: `Your lesson with ${teacherName} is tomorrow at ${lessonTime}`,
    bodyContent,
    ctaButton: {
      text: 'View Lesson Details',
      url: 'https://example.com/lessons',
    },
  });
}
```

### Best Practices

1. **Mobile-First Design**
   - Base template is responsive (max-width: 600px)
   - Text scales down on mobile
   - Buttons are touch-friendly

2. **Dark Mode Support**
   - Dark mode handled automatically via CSS classes
   - Use semantic class names: `.text-primary`, `.text-secondary`, `.card`

3. **Accessibility**
   - Use semantic HTML
   - Include alt text for images
   - Ensure sufficient color contrast

4. **Email Client Compatibility**
   - Inline styles are preferred
   - Avoid CSS grid/flexbox (use tables for layout if needed)
   - Test in Outlook, Gmail, Apple Mail

5. **Content Guidelines**
   - Keep subject lines under 50 characters
   - Use preheader text (shows in inbox preview)
   - Include clear call-to-action
   - Always include unsubscribe link (handled by base template)

---

## Testing Guidelines

### Unit Tests

Location: `/lib/email/templates/__tests__/`

**Template Test Pattern:**

```typescript
// lib/email/templates/__tests__/new-notification.test.ts
import { generateNewNotificationEmail } from '../new-notification';

describe('generateNewNotificationEmail', () => {
  it('should generate valid HTML', () => {
    const result = generateNewNotificationEmail({
      recipientName: 'John Doe',
      field1: 'Value',
    });

    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('Hi John Doe,');
    expect(result).toContain('Value');
  });

  it('should include CTA button when provided', () => {
    const result = generateNewNotificationEmail({
      recipientName: 'Jane',
      field1: 'Test',
    });

    expect(result).toContain('href=');
    expect(result).toContain('View Details');
  });

  it('should escape HTML in user input', () => {
    const result = generateNewNotificationEmail({
      recipientName: '<script>alert("xss")</script>',
      field1: 'Safe',
    });

    expect(result).not.toContain('<script>');
  });
});
```

**Service Test Pattern:**

```typescript
// lib/services/__tests__/notification-service.test.ts
import { sendNotification, queueNotification } from '../notification-service';

describe('Notification Service', () => {
  beforeEach(async () => {
    // Reset database state
    await clearNotificationTables();
  });

  it('should send notification immediately', async () => {
    const result = await sendNotification({
      type: 'lesson_reminder_24h',
      recipientUserId: 'user-id',
      templateData: { studentName: 'John' },
    });

    expect(result.success).toBe(true);
    expect(result.logId).toBeDefined();
  });

  it('should skip notification if user disabled', async () => {
    await disablePreference('user-id', 'lesson_reminder_24h');

    const result = await sendNotification({
      type: 'lesson_reminder_24h',
      recipientUserId: 'user-id',
      templateData: { studentName: 'John' },
    });

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
  });
});
```

### Integration Tests

Location: `/app/actions/__tests__/` or `/lib/services/__tests__/`

**Cron Job Test:**

```typescript
describe('Process Notification Queue', () => {
  it('should process queued notifications', async () => {
    // 1. Queue notification
    await queueNotification({
      type: 'lesson_reminder_24h',
      recipientUserId: 'user-id',
      templateData: { studentName: 'John' },
      scheduledFor: new Date(), // Send now
    });

    // 2. Process queue
    const { processed } = await processQueuedNotifications();

    // 3. Verify
    expect(processed).toBe(1);

    const logs = await getNotificationLogs('user-id');
    expect(logs[0].status).toBe('sent');
  });
});
```

### E2E Tests (Cypress)

Location: `/cypress/e2e/`

**Notification Preferences E2E:**

```typescript
// cypress/e2e/notification-preferences.cy.ts
describe('Notification Preferences', () => {
  beforeEach(() => {
    cy.login('student@example.com', 'test123_student');
    cy.visit('/settings/notifications');
  });

  it('should toggle notification preference', () => {
    // Find toggle for lesson reminders
    cy.get('[data-testid="toggle-lesson_reminder_24h"]').click();

    // Verify saved
    cy.contains('Preferences saved').should('be.visible');

    // Reload page and verify persisted
    cy.reload();
    cy.get('[data-testid="toggle-lesson_reminder_24h"]')
      .should('not.be.checked');
  });
});
```

### Mocking

**Mock Supabase:**

```typescript
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
    })),
  }),
}));
```

**Mock SMTP:**

```typescript
jest.mock('@/lib/email/smtp-client', () => ({
  default: {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  },
}));
```

### Coverage Requirements

Minimum 70% code coverage for notification system:

```bash
npm run test:coverage
```

**Coverage targets:**
- Templates: 80%+
- Service layer: 75%+
- Server actions: 70%+
- Retry/rate limiting: 90%+

---

## Database Schema

### Tables

#### `notification_preferences`

User-level opt-in/opt-out settings.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to profiles(id) |
| `notification_type` | notification_type | Type of notification |
| `enabled` | BOOLEAN | Is this notification enabled? |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Unique constraint:** `(user_id, notification_type)`

**Indexes:**
- `ix_notification_preferences_user` on `user_id`
- `ix_notification_preferences_type` on `notification_type`
- `ix_notification_preferences_enabled` on `(user_id, enabled) WHERE enabled = true`

#### `notification_log`

Audit trail for all notification attempts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `notification_type` | notification_type | Type of notification |
| `recipient_user_id` | UUID | FK to profiles(id) |
| `recipient_email` | TEXT | Email address sent to |
| `status` | notification_status | Delivery status |
| `subject` | TEXT | Email subject line |
| `template_data` | JSONB | Data passed to template |
| `sent_at` | TIMESTAMPTZ | When successfully sent |
| `error_message` | TEXT | Error details if failed |
| `retry_count` | INT | Number of retry attempts |
| `max_retries` | INT | Maximum retries (default 5) |
| `entity_type` | TEXT | Related entity type (optional) |
| `entity_id` | UUID | Related entity ID (optional) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `ix_notification_log_user` on `(recipient_user_id, created_at DESC)`
- `ix_notification_log_type` on `(notification_type, created_at DESC)`
- `ix_notification_log_status` on `(status, created_at DESC)`
- `ix_notification_log_entity` on `(entity_type, entity_id) WHERE entity_type IS NOT NULL`
- `ix_notification_log_retry` on `(status, retry_count) WHERE status = 'failed'`

#### `notification_queue`

Queue for scheduled/delayed notifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `notification_type` | notification_type | Type of notification |
| `recipient_user_id` | UUID | FK to profiles(id) |
| `template_data` | JSONB | Data for template |
| `scheduled_for` | TIMESTAMPTZ | When to send |
| `processed_at` | TIMESTAMPTZ | When processed |
| `status` | notification_status | Queue status |
| `priority` | INT | Priority (1-10, higher first) |
| `entity_type` | TEXT | Related entity type (optional) |
| `entity_id` | UUID | Related entity ID (optional) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `ix_notification_queue_scheduled` on `scheduled_for WHERE status = 'pending'`
- `ix_notification_queue_user` on `recipient_user_id`
- `ix_notification_queue_priority` on `(priority DESC, scheduled_for ASC) WHERE status = 'pending'`
- `ix_notification_queue_status` on `status`

### Enums

#### `notification_type`

All available notification types:

- **Lessons:** `lesson_reminder_24h`, `lesson_recap`, `lesson_cancelled`, `lesson_rescheduled`
- **Assignments:** `assignment_created`, `assignment_due_reminder`, `assignment_overdue_alert`, `assignment_completed`
- **Achievements:** `song_mastery_achievement`, `milestone_reached`
- **Lifecycle:** `student_welcome`, `trial_ending_reminder`
- **Digests:** `teacher_daily_summary`, `weekly_progress_digest`
- **System:** `calendar_conflict_alert`, `webhook_expiration_notice`, `admin_error_alert`

#### `notification_status`

Delivery status tracking:

- `pending` - Queued, not yet sent
- `sent` - Successfully delivered
- `failed` - Delivery failed, will retry
- `bounced` - Email bounced, user email invalid
- `skipped` - Skipped due to user preference
- `cancelled` - Cancelled before sending

### RLS Policies

**notification_preferences:**
- Users can SELECT and UPDATE their own preferences
- Admins can SELECT all preferences

**notification_log:**
- Users can SELECT their own logs
- Admins can SELECT all logs
- Service role can perform all operations

**notification_queue:**
- Users can SELECT their own queued notifications
- Admins can SELECT all queued notifications
- Service role can manage queue

### Helper Functions

#### `is_notification_enabled(user_id UUID, notification_type notification_type)`

Check if user has enabled a specific notification type.

**Returns:** `BOOLEAN` (defaults to `true` if no preference found)

#### `get_pending_notifications(batch_size INT)`

Get batch of pending notifications ready for processing with row locking.

**Returns:** Table of pending notifications

**Uses:** `FOR UPDATE SKIP LOCKED` to prevent concurrent processing

---

## Cron Jobs

All cron jobs are defined in `/vercel.json` and implemented in `/app/api/cron/`.

### Schedule Overview

| Cron Job | Schedule | Description |
|----------|----------|-------------|
| **process-notification-queue** | Every 15 min (`*/15 * * * *`) | Process pending notifications from queue |
| **lesson-reminders** | Daily 10:00 AM (`0 10 * * *`) | Send 24-hour lesson reminders |
| **assignment-due-reminders** | Daily 9:00 AM (`0 9 * * *`) | Send reminders for assignments due in 2 days |
| **assignment-overdue-check** | Daily 6:00 PM (`0 18 * * *`) | Send alerts for overdue assignments |
| **weekly-digest** | Sunday 6:00 PM (`0 18 * * 0`) | Send weekly progress digest to students |
| **weekly-insights** | Monday 9:00 AM (`0 9 * * 1`) | Send weekly insights to teachers |
| **renew-webhooks** | Daily 2:00 AM (`0 2 * * *`) | Renew expiring calendar webhooks |

### Implementation Details

#### Process Notification Queue

**File:** `/app/api/cron/process-notification-queue/route.ts`

**Purpose:** Process queued notifications every 15 minutes

```typescript
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Process queue
  const { processed, failed } = await processQueuedNotifications(100);

  return Response.json({ processed, failed });
}
```

**Batch size:** 100 notifications per run

#### Lesson Reminders

**File:** `/app/api/cron/lesson-reminders/route.ts`

**Purpose:** Queue 24-hour reminders for upcoming lessons

**Logic:**
1. Find lessons scheduled 24 hours from now
2. For each lesson, queue `lesson_reminder_24h` notification
3. Only queue if not already queued

#### Retry Failed Notifications

Handled by `retryFailedNotifications()` in notification service.

**Backoff schedule:**
- Retry 1: 1 minute
- Retry 2: 5 minutes
- Retry 3: 30 minutes
- Retry 4: 2 hours
- Retry 5: 24 hours
- After 5 retries: Move to dead letter (status: `bounced`)

### Testing Cron Jobs Locally

#### Option 1: Direct HTTP Request

```bash
# Test process-notification-queue
curl -X GET http://localhost:3000/api/cron/process-notification-queue \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

#### Option 2: Use Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Trigger cron via dashboard or CLI
vercel cron <job-id>
```

#### Option 3: Manual Trigger in Code

Create a test script:

```typescript
// scripts/test-cron.ts
import { processQueuedNotifications } from '@/lib/services/notification-service';

async function main() {
  const result = await processQueuedNotifications();
  console.log('Processed:', result.processed);
  console.log('Failed:', result.failed);
}

main();
```

Run:
```bash
npx tsx scripts/test-cron.ts
```

### Monitoring Cron Jobs

#### Vercel Dashboard

View cron execution logs:
1. Go to Vercel dashboard
2. Select project
3. Navigate to "Cron Jobs" tab
4. View execution history and logs

#### Database Queries

```sql
-- Check recent notification queue processing
SELECT
  DATE_TRUNC('hour', processed_at) as hour,
  status,
  COUNT(*) as count
FROM notification_queue
WHERE processed_at > NOW() - INTERVAL '24 hours'
GROUP BY hour, status
ORDER BY hour DESC;

-- Check notification send success rate
SELECT
  notification_type,
  status,
  COUNT(*) as count
FROM notification_log
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY notification_type, status;

-- Check failed notifications needing retry
SELECT
  id,
  notification_type,
  retry_count,
  error_message,
  updated_at
FROM notification_log
WHERE status = 'failed'
  AND retry_count < 5
ORDER BY updated_at DESC
LIMIT 20;
```

### Cron Job Logs

Each cron job returns JSON with execution summary:

```json
{
  "processed": 45,
  "failed": 2,
  "timestamp": "2025-01-15T10:00:00Z"
}
```

Failed executions return error details:

```json
{
  "error": "Database connection failed",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

---

## Troubleshooting

### Common Issues

#### Issue: Notifications Not Sending

**Symptoms:**
- Entries in `notification_queue` with `status = 'pending'`
- No corresponding entries in `notification_log`

**Debug steps:**

1. **Check cron job execution:**
   ```bash
   # Manually trigger queue processor
   curl -X GET http://localhost:3000/api/cron/process-notification-queue \
     -H "Authorization: Bearer ${CRON_SECRET}"
   ```

2. **Check user preferences:**
   ```sql
   SELECT * FROM notification_preferences
   WHERE user_id = '<user-id>'
     AND notification_type = '<type>';
   ```

3. **Check SMTP credentials:**
   ```bash
   # Verify environment variables
   echo $GMAIL_USER
   echo $GMAIL_PASS
   ```

4. **Test SMTP connection:**
   ```typescript
   // scripts/test-smtp.ts
   import transporter from '@/lib/email/smtp-client';

   transporter.verify()
     .then(() => console.log('SMTP ready'))
     .catch(err => console.error('SMTP error:', err));
   ```

5. **Check notification logs for errors:**
   ```sql
   SELECT * FROM notification_log
   WHERE status = 'failed'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

#### Issue: Queue Backlog

**Symptoms:**
- Large number of pending notifications in queue
- Processing time exceeds 15-minute window

**Solutions:**

1. **Increase batch size:**
   ```typescript
   // In process-notification-queue/route.ts
   const { processed, failed } = await processQueuedNotifications(200); // Increase from 100
   ```

2. **Check rate limiting:**
   ```typescript
   import { __testing__ } from '@/lib/email/rate-limiter';

   const stats = __testing__.getStats();
   console.log('System email count:', stats.systemCount);
   // If close to 1000/hour, queue will slow down
   ```

3. **Optimize query performance:**
   ```sql
   -- Verify indexes are used
   EXPLAIN ANALYZE
   SELECT * FROM notification_queue
   WHERE status = 'pending'
     AND scheduled_for <= NOW()
   ORDER BY priority DESC, scheduled_for ASC
   LIMIT 100;
   ```

4. **Process manually:**
   ```bash
   # Process in batches until cleared
   for i in {1..10}; do
     curl -X GET http://localhost:3000/api/cron/process-notification-queue \
       -H "Authorization: Bearer ${CRON_SECRET}"
     sleep 5
   done
   ```

#### Issue: Rate Limiting

**Symptoms:**
- Notifications delayed
- Logs show rate limit errors

**Solutions:**

1. **Check current limits:**
   ```typescript
   import { __testing__ } from '@/lib/email/rate-limiter';

   const stats = __testing__.getStats();
   console.log('Users:', stats.userCount);
   console.log('System total:', stats.systemCount);
   ```

2. **Adjust rate limits (if appropriate):**
   ```typescript
   // In lib/email/rate-limiter.ts
   const USER_LIMIT = 150; // Increase from 100
   const SYSTEM_LIMIT = 1500; // Increase from 1000
   ```

3. **Spread out notification sending:**
   - Use priority levels to control send order
   - Schedule digests during off-peak hours

#### Issue: Bounce Handling

**Symptoms:**
- Users not receiving emails
- Notifications marked as `bounced`

**Debug steps:**

1. **Check bounce count:**
   ```sql
   SELECT
     recipient_user_id,
     recipient_email,
     COUNT(*) as bounce_count
   FROM notification_log
   WHERE status = 'bounced'
   GROUP BY recipient_user_id, recipient_email
   ORDER BY bounce_count DESC;
   ```

2. **Check if user disabled:**
   ```sql
   SELECT id, email, is_active
   FROM profiles
   WHERE id = '<user-id>';
   ```

3. **Get bounce stats:**
   ```typescript
   import { getBounceStats } from '@/lib/email/bounce-handler';

   const stats = await getBounceStats('user-id');
   console.log('Total bounces:', stats.totalBounces);
   console.log('Consecutive:', stats.consecutiveBounces);
   console.log('Is disabled:', stats.isDisabled);
   ```

4. **Re-enable notifications (admin only):**
   ```typescript
   import { reenableNotificationsForUser } from '@/lib/email/bounce-handler';

   await reenableNotificationsForUser('user-id', 'admin-id');
   ```

### Debug Logs

Enable verbose logging:

```typescript
// In notification-service.ts
console.log('[NOTIFICATION]', {
  type,
  recipientUserId,
  status,
  timestamp: new Date().toISOString(),
});
```

### Log Locations

**Local development:**
- Console output (terminal running `npm run dev`)

**Vercel production:**
- Vercel dashboard → Functions → Logs
- Filter by `/api/cron/*` for cron logs

**Database logs:**
```sql
-- View recent notification activity
SELECT
  notification_type,
  status,
  created_at,
  error_message
FROM notification_log
ORDER BY created_at DESC
LIMIT 50;
```

### Health Check Endpoint

Create a health check for notification system:

```typescript
// app/api/health/notifications/route.ts
export async function GET() {
  const checks = {
    queue_pending: 0,
    recent_failures: 0,
    rate_limit_status: 'ok',
  };

  // Check pending queue
  const { data: queueData } = await supabase
    .from('notification_queue')
    .select('id')
    .eq('status', 'pending');
  checks.queue_pending = queueData?.length || 0;

  // Check recent failures
  const { data: failureData } = await supabase
    .from('notification_log')
    .select('id')
    .eq('status', 'failed')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());
  checks.recent_failures = failureData?.length || 0;

  return Response.json(checks);
}
```

Access: `http://localhost:3000/api/health/notifications`

---

## Configuration

### Environment Variables

Required environment variables for notification system:

```bash
# SMTP Configuration (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-specific-password

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_BASE_URL_REMOTE=https://your-domain.com

# Cron Secret (for securing cron endpoints)
CRON_SECRET=your-random-secret-key

# Supabase (Admin access)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

### Feature Flags

Control notification features via environment variables:

```bash
# Disable all notifications (for maintenance)
NOTIFICATIONS_ENABLED=false

# Enable/disable specific notification types
NOTIFICATIONS_LESSONS_ENABLED=true
NOTIFICATIONS_ACHIEVEMENTS_ENABLED=true
NOTIFICATIONS_DIGESTS_ENABLED=false
```

Use in code:

```typescript
// Check feature flag
if (process.env.NOTIFICATIONS_ENABLED === 'false') {
  console.log('Notifications disabled');
  return { success: false, error: 'Notifications disabled' };
}
```

### Rate Limits

Configure in `/lib/email/rate-limiter.ts`:

```typescript
const USER_LIMIT = 100; // emails per hour per user
const SYSTEM_LIMIT = 1000; // emails per hour system-wide
const WINDOW_MS = 60 * 60 * 1000; // 1 hour window
```

**Gmail limits:**
- Free accounts: 500 emails/day
- Workspace accounts: 2000 emails/day
- Recommended: Stay below 50% of limit

### Retry Settings

Configure in `/lib/email/retry-handler.ts`:

```typescript
export const MAX_RETRY_ATTEMPTS = 5;
export const BACKOFF_SCHEDULE_MINUTES = [1, 5, 30, 120, 1440];
```

### Default Preferences

Configure in migration `032_notification_system.sql`:

```sql
-- Set default opt-out for digest emails
WHEN notification_type_val IN ('weekly_progress_digest', 'teacher_daily_summary')
  THEN false
ELSE true
END
```

### Priority Levels

Use when queuing notifications:

```typescript
const PRIORITY_LEVELS = {
  CRITICAL: 10,  // Immediate delivery (lesson cancelled)
  HIGH: 8,       // Send soon (lesson rescheduled)
  NORMAL: 5,     // Standard queue (lesson recap)
  LOW: 3,        // Can wait (weekly digest)
  BULK: 1,       // Lowest priority (marketing)
};
```

### SMTP Configuration

**Gmail Setup:**

1. Enable 2-factor authentication on Google account
2. Generate App Password:
   - Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other" (custom name)
   - Copy generated password to `GMAIL_PASS`

**Alternative SMTP providers:**

```typescript
// lib/email/smtp-client.ts
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., smtp.sendgrid.net
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

---

## Additional Resources

### Related Files

- **Database Schema:** `/supabase/migrations/032_notification_system.sql`
- **Database Triggers:** `/supabase/migrations/033_notification_triggers.sql`
- **Service Layer:** `/lib/services/notification-service.ts`
- **Type Definitions:** `/types/notifications.ts`
- **Email Templates:** `/lib/email/templates/`
- **Cron Jobs:** `/app/api/cron/`
- **Server Actions:** `/app/actions/notification-preferences.ts`

### Testing Files

- **Service Tests:** `/lib/services/__tests__/notification-service.test.ts`
- **Template Tests:** `/lib/email/templates/__tests__/`
- **Retry Tests:** `/lib/email/__tests__/retry-handler.test.ts`
- **Rate Limit Tests:** `/lib/email/__tests__/rate-limiter.test.ts`

### External Documentation

- [Nodemailer Documentation](https://nodemailer.com/)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Email Client CSS Support](https://www.caniemail.com/)

### Project Documentation

- **Main README:** `/2026-03-16-2025-11-02-README.md`
- **Project Guidelines:** `/CLAUDE.md`
- **User Documentation:** `/docs/USER_GUIDE.md` (to be created)

---

## Support

For questions or issues with the notification system:

1. Check this documentation first
2. Review existing tests for examples
3. Check Troubleshooting section
4. Inspect database logs and queue state
5. Contact the development team

**Last updated:** 2025-01-15
