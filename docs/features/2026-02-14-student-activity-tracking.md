# Student Activity Tracking

## Overview

Automatically manages student engagement status based on lesson activity. Students are marked as "inactive" if they haven't had a completed lesson in the last 28 days and have no future lessons scheduled.

## How It Works

### Status Transitions

**Active → Inactive**
- Triggered when:
  - No completed lesson in last 28 days
  - AND no future scheduled lessons

**Inactive → Active**
- Triggered when:
  - Has a completed lesson in last 28 days
  - OR has a future scheduled lesson

### Automated Updates

- **Frequency**: Daily at 2:30 AM UTC
- **Scope**: Only affects students with `student_status = 'active'` or `'inactive'`
- **Exclusions**: Does not affect `lead`, `trial`, or `churned` statuses (manually managed)

### Audit Trail

All status changes are logged to `user_history` table with:
- Previous and new status
- Timestamp of change
- Reason (has recent lesson, has future lesson)
- `changed_by = null` (system-initiated)

## Configuration

### Environment Variables

```bash
# Required for production cron job authentication
CRON_SECRET=<secure-random-string>
```

### Vercel Cron Configuration

```json
{
  "path": "/api/cron/update-student-status",
  "schedule": "30 2 * * *"
}
```

**Schedule**: `30 2 * * *` = Daily at 2:30 AM UTC

## API Reference

### Cron Endpoint

```
GET /api/cron/update-student-status
Authorization: Bearer <CRON_SECRET>
```

**Response:**
```json
{
  "success": true,
  "processed": 45,
  "activatedCount": 2,
  "deactivatedCount": 5,
  "activated": [...],
  "deactivated": [...],
  "timestamp": "2025-02-14T02:30:00Z"
}
```

## Testing

### Local Testing

```bash
curl http://localhost:3000/api/cron/update-student-status
```

### Unit Tests

```bash
npm test -- student-activity
```
