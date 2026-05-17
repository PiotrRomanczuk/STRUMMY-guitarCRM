# Unsubscribe Flow Documentation

## Overview

The unsubscribe flow allows users to opt-out of specific notification types directly from email links without requiring authentication.

## Architecture

### 1. API Route: `/app/api/notifications/unsubscribe/route.ts`

**Endpoint:** `GET /api/notifications/unsubscribe`

**Query Parameters:**
- `userId` (required): UUID of the user
- `type` (required): NotificationType to unsubscribe from

**Flow:**
1. Validates required parameters
2. Validates notification type exists
3. Verifies user exists in profiles table
4. Updates `notification_preferences` table to set `enabled = false`
5. Redirects to confirmation page with success/error status

**Error Handling:**
- `missing_params`: Required query parameters missing
- `invalid_type`: Notification type doesn't exist
- `user_not_found`: User ID doesn't match any profile
- `update_failed`: Database update failed
- `server_error`: Unexpected error occurred

### 2. Confirmation Page: `/app/unsubscribe/page.tsx`

**Route:** `/unsubscribe`

**Query Parameters:**
- `success`: Boolean indicating successful unsubscribe
- `error`: Error code if unsubscribe failed
- `type`: NotificationType that was unsubscribed

**UI States:**

#### Success State
- Green checkmark icon
- Displays notification type name and description
- "Manage All Notification Preferences" button (→ `/dashboard/settings`)
- "Go to Dashboard" button
- Re-subscribe info text

#### Error States
- Red X icon
- Error-specific title and message
- Navigation buttons to settings and dashboard

#### Default State (no params)
- Generic email icon
- General notification preferences info
- Navigation buttons

**Features:**
- Dark mode support
- Mobile responsive
- Loading state with spinner
- Accessible error messages

### 3. Email Template Integration

**File:** `/lib/email/templates/base-template.ts`

**Updated Interface:**
```typescript
export interface BaseEmailTemplateOptions {
  recipientUserId?: string;  // User's UUID
  notificationType?: string; // Notification type to unsubscribe from
  // ... other fields
}
```

**Unsubscribe Link Generation:**
```typescript
function getUnsubscribeLink(
  recipientUserId?: string,
  notificationType?: string
): string {
  if (recipientUserId && notificationType) {
    return `${baseUrl}/api/notifications/unsubscribe?userId=${userId}&type=${type}`;
  }
  return `${baseUrl}/dashboard/settings`; // Fallback
}
```

**Footer Links:**
- "Manage notification preferences" → Settings page
- "Unsubscribe" → Direct unsubscribe API call

## Usage in Email Templates

When creating email templates, pass `recipientUserId` and `notificationType` to enable direct unsubscribe:

```typescript
generateBaseEmailHtml({
  subject: 'Lesson Reminder',
  bodyContent: '...',
  recipientUserId: userId,
  notificationType: 'lesson_reminder_24h',
});
```

## Database Schema

**Table:** `notification_preferences`

```sql
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    notification_type notification_type NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(user_id, notification_type)
);
```

## Security Considerations

### Current Implementation (Simple)
- Uses `userId` + `type` in URL
- No authentication required
- Anyone with the link can unsubscribe
- Appropriate for one-time use from emails

### Future Enhancement (Token-based)
- Generate signed token containing userId + type + expiration
- Verify token signature before processing
- Expire tokens after 30-90 days
- More secure, prevents URL manipulation

Example token implementation:
```typescript
// Generate
const token = jwt.sign(
  { userId, type, exp: Date.now() + 90 * 24 * 60 * 60 * 1000 },
  process.env.UNSUBSCRIBE_SECRET
);

// Verify
const { userId, type } = jwt.verify(token, process.env.UNSUBSCRIBE_SECRET);
```

## Testing

### Manual Testing

1. **Success Flow:**
   ```
   GET /api/notifications/unsubscribe?userId=<valid-uuid>&type=lesson_reminder_24h
   → Redirects to: /unsubscribe?success=true&type=lesson_reminder_24h
   → Check database: enabled = false
   ```

2. **Error Flows:**
   ```
   GET /api/notifications/unsubscribe?userId=invalid
   → Redirects to: /unsubscribe?error=missing_params

   GET /api/notifications/unsubscribe?userId=<uuid>&type=invalid_type
   → Redirects to: /unsubscribe?error=invalid_type
   ```

3. **Re-subscribe:**
   - Click "Manage All Notification Preferences" on confirmation page
   - Toggle notification back on in settings
   - Verify database: enabled = true

### Automated Tests

Create tests in `/app/api/notifications/unsubscribe/__tests__/route.test.ts`:

- Valid unsubscribe updates database
- Missing parameters return error
- Invalid notification type returns error
- Non-existent user returns error
- Redirects contain correct query params

## Monitoring

Log unsubscribe events for analytics:

```typescript
console.log(`User ${userId} unsubscribed from ${notificationType}`);
```

Consider tracking in database:
- Unsubscribe count by notification type
- Most unsubscribed notifications
- Unsubscribe trends over time

## Related Files

- `/app/api/notifications/unsubscribe/route.ts` - API endpoint
- `/app/unsubscribe/page.tsx` - Confirmation page
- `/lib/email/templates/base-template.ts` - Email template base
- `/app/actions/notification-preferences.ts` - Preference management actions
- `/types/notifications.ts` - Type definitions
- `/supabase/migrations/032_notification_system.sql` - Database schema

## Future Enhancements

1. **Token-based unsubscribe** - More secure signed tokens
2. **Unsubscribe reasons** - Collect feedback on why users unsubscribe
3. **Unsubscribe all** - Single link to disable all notifications
4. **Temporary pause** - Pause notifications for X days instead of permanent unsubscribe
5. **Frequency control** - Reduce notification frequency instead of complete opt-out
6. **Category unsubscribe** - Unsubscribe from entire categories (e.g., all lesson notifications)
