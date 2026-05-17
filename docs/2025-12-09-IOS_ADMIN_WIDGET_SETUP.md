# Guitar CRM - Admin Widget Setup Guide

This guide will help you set up an **Admin Statistics Widget** for Guitar CRM on your iPhone/iPad using the Scriptable app. This widget shows system-wide statistics and is **only accessible to users with admin role**.

## Prerequisites

1. **iPhone or iPad** running iOS 14 or later
2. **Scriptable app** - Download from [App Store](https://apps.apple.com/us/app/scriptable/id1405459188)
3. **Guitar CRM account with ADMIN role** and API key

---

## Important: Admin Access Required

⚠️ **This widget endpoint requires admin privileges**. If you attempt to use it without admin role, you will receive a `403 Forbidden` error.

**Who can use this widget:**
- ✅ Users with `admin` role
- ❌ Teachers (use the regular dashboard widget)
- ❌ Students (use the regular dashboard widget)

---

## Step 1: Generate Admin API Key

1. Open Guitar CRM web application **as an administrator**
2. Navigate to **Settings** → **API Keys**
3. Click **"Create New API Key"**
4. Enter a name: `iOS Admin Widget`
5. Click **Create**
6. **⚠️ IMPORTANT**: Copy the API key immediately - it will only be shown once!
   - Format: `gcrm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 2: Install Admin Widget Script

1. Open **Scriptable** app on your iPhone/iPad
2. Tap the **+** button (top right) to create a new script
3. Name it: `Guitar CRM Admin Widget`
4. Copy and paste the code below:

```javascript
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: chart-bar;

// Guitar CRM Admin Widget for Scriptable
// Shows system statistics and overview (Admin only)

// Configuration - Set your API key and server URL
const API_KEY = args.widgetParameter || 'YOUR_API_KEY_HERE';
const API_URL = 'https://your-app-url.vercel.app/api/widget/admin';

// Create widget
let widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}

Script.complete();

// Main widget creation function
async function createWidget() {
  let widget = new ListWidget();
  widget.backgroundColor = new Color('#1a1a2e');
  widget.setPadding(12, 12, 12, 12);

  try {
    // Fetch admin data
    let req = new Request(API_URL);
    req.headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    let data = await req.loadJSON();

    // Check for error
    if (data.error) {
      if (data.error.includes('Forbidden') || data.error.includes('Admin')) {
        return createErrorWidget(widget, '🔐 Admin Access Required', 'You must have admin role to view this widget.');
      }
      return createErrorWidget(widget, '⚠️ Error', data.error);
    }

    // Header with user name
    let header = widget.addStack();
    header.layoutHorizontally();
    
    let userIcon = header.addText('👤 ');
    userIcon.font = Font.systemFont(13);
    
    let userName = header.addText(data.user.name);
    userName.font = Font.boldSystemFont(13);
    userName.textColor = Color.white();
    
    widget.addSpacer(2);

    // Admin badge
    let badge = widget.addText('🔐 ADMIN DASHBOARD');
    badge.font = Font.boldSystemFont(10);
    badge.textColor = new Color('#ffd700');
    
    widget.addSpacer(6);

    // User Statistics
    let userStats = widget.addStack();
    userStats.layoutHorizontally();
    let userStatsIcon = userStats.addText('👥 ');
    userStatsIcon.font = Font.systemFont(11);
    let userStatsText = userStats.addText(
      `${data.stats.users.total} Users (${data.stats.users.teachers}T/${data.stats.users.students}S)`
    );
    userStatsText.font = Font.mediumSystemFont(10);
    userStatsText.textColor = Color.white();
    widget.addSpacer(3);

    // Lesson Statistics
    let lessonStats = widget.addStack();
    lessonStats.layoutHorizontally();
    let lessonIcon = lessonStats.addText('📚 ');
    lessonIcon.font = Font.systemFont(11);
    let lessonText = lessonStats.addText(
      `${data.stats.lessons.total} Lessons (${data.stats.lessons.upcoming7Days} upcoming)`
    );
    lessonText.font = Font.mediumSystemFont(10);
    lessonText.textColor = Color.white();
    widget.addSpacer(3);

    // Song Statistics
    let songStats = widget.addStack();
    songStats.layoutHorizontally();
    let songIcon = songStats.addText('🎵 ');
    songIcon.font = Font.systemFont(11);
    let songText = songStats.addText(`${data.stats.songs.total} Songs`);
    songText.font = Font.mediumSystemFont(10);
    songText.textColor = Color.white();
    widget.addSpacer(3);

    // Pending Assignments
    let assignStats = widget.addStack();
    assignStats.layoutHorizontally();
    let assignIcon = assignStats.addText('📝 ');
    assignIcon.font = Font.systemFont(11);
    let assignText = assignStats.addText(`${data.stats.assignments.pending} Pending Assignments`);
    assignText.font = Font.mediumSystemFont(10);
    assignText.textColor = Color.white();
    widget.addSpacer(5);

    // Recent Activity Header
    let activityHeader = widget.addText('📊 RECENT (30 days)');
    activityHeader.font = Font.boldSystemFont(9);
    activityHeader.textColor = new Color('#8b93ff');
    widget.addSpacer(3);

    // Recent metrics
    let recentStack = widget.addStack();
    recentStack.layoutHorizontally();
    let recentText = recentStack.addText(
      `+${data.stats.users.recentNew} Users • ${data.stats.lessons.recent30Days} Lessons`
    );
    recentText.font = Font.systemFont(9);
    recentText.textColor = new Color('#9ca3af');
    widget.addSpacer(5);

    // Top Teachers
    if (data.topTeachers && data.topTeachers.length > 0) {
      let teacherHeader = widget.addText('🏆 TOP TEACHERS');
      teacherHeader.font = Font.boldSystemFont(9);
      teacherHeader.textColor = new Color('#8b93ff');
      widget.addSpacer(2);

      let topCount = Math.min(3, data.topTeachers.length);
      for (let i = 0; i < topCount; i++) {
        let teacher = data.topTeachers[i];
        let teacherStack = widget.addStack();
        teacherStack.layoutHorizontally();
        let teacherText = teacherStack.addText(`• ${teacher.name}: ${teacher.lessons} lessons`);
        teacherText.font = Font.systemFont(8);
        teacherText.textColor = new Color('#9ca3af');
        widget.addSpacer(1);
      }
    }

    widget.addSpacer();

    // Footer with last update time
    let footer = widget.addText(`Updated: ${formatTime(new Date(data.lastUpdated))}`);
    footer.font = Font.systemFont(7);
    footer.textColor = new Color('#6b7280');
    footer.textOpacity = 0.7;

    return widget;
    
  } catch (error) {
    return createErrorWidget(widget, '⚠️ Connection Error', error.message);
  }
}

// Format time as HH:MM
function formatTime(date) {
  let hours = date.getHours().toString().padStart(2, '0');
  let minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Create error widget
function createErrorWidget(widget, title, message) {
  widget.backgroundColor = new Color('#2d1b1b');
  
  let errorTitle = widget.addText(title);
  errorTitle.font = Font.boldSystemFont(12);
  errorTitle.textColor = new Color('#ff6b6b');
  
  widget.addSpacer(4);
  
  let errorMsg = widget.addText(message);
  errorMsg.font = Font.systemFont(10);
  errorMsg.textColor = Color.white();
  
  return widget;
}
```

5. Save the script

---

## Step 3: Configure the Widget

### Update API URL

In the script, find this line:
```javascript
const API_URL = 'https://your-app-url.vercel.app/api/widget/admin';
```

Replace `your-app-url.vercel.app` with your actual Guitar CRM URL.

**Examples:**
- Production: `https://guitar-crm.vercel.app/api/widget/admin`
- Custom domain: `https://crm.yourschool.com/api/widget/admin`
- Local testing: `http://localhost:3000/api/widget/admin`

---

## Step 4: Add Widget to Home Screen

1. **Long press** on your iPhone home screen
2. Tap the **+** button (top left)
3. Search for **"Scriptable"**
4. Select **Medium** widget size (recommended for admin stats)
5. Tap **"Add Widget"**
6. **Long press** the newly added widget
7. Tap **"Edit Widget"**
8. Under **"Script"**, select `Guitar CRM Admin Widget`
9. Under **"Parameter"**, paste your admin API key
10. Tap outside to save

---

## Widget Features

### System Overview

- **User Statistics**: Total users with teacher/student breakdown
- **Lesson Metrics**: Total lessons and upcoming count (next 7 days)
- **Song Library**: Total songs in the system
- **Assignments**: Pending assignments count
- **Recent Activity**: New users and lessons in last 30 days
- **Top Teachers**: Most active teachers by lesson count (top 3-5)

### Visual Indicators

- 🔐 **Admin badge** - Confirms admin-only access
- 👥 **Users** - System-wide user counts
- 📚 **Lessons** - Lesson activity metrics
- 🎵 **Songs** - Song library size
- 📝 **Assignments** - Pending assignments
- 📊 **Recent Activity** - 30-day trends
- 🏆 **Top Teachers** - Performance leaderboard

---

## Testing Your Setup

### Test with curl (Before iOS)

```bash
# Test admin access
curl -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
     -H "Content-Type: application/json" \
     https://your-app-url.vercel.app/api/widget/admin
```

**Expected response (200 OK):**
```json
{
  "user": {
    "name": "Your Name",
    "role": "admin"
  },
  "stats": {
    "users": { "total": 150, "teachers": 25, "students": 120, "recentNew": 5 },
    "lessons": { "total": 1250, "recent30Days": 180, "upcoming7Days": 45 },
    "assignments": { "pending": 78 },
    "songs": { "total": 320 },
    "apiKeys": { "active": 12 }
  },
  "upcomingLessons": [...],
  "topTeachers": [...],
  "lastUpdated": "2025-12-09T10:30:00.000Z"
}
```

**Error response (403 Forbidden):**
```json
{
  "error": "Forbidden. Admin access required."
}
```

---

## Troubleshooting

### "403 Forbidden" Error

**Cause**: Your account doesn't have admin role.

**Solution**:
1. Verify with system administrator that your account has admin privileges
2. Check the `user_roles` table: your user should have a role entry with `role='admin'`
3. Generate a new API key after admin role is assigned
4. Contact your Guitar CRM administrator to grant admin access

### "401 Unauthorized" Error

**Cause**: Invalid or expired API key.

**Solution**:
1. Generate a new API key from Settings
2. Copy the key immediately when shown
3. Update the widget parameter with the new key

### "Connection Error"

**Cause**: Network issues or incorrect API URL.

**Solution**:
1. Check your internet connection
2. Verify the API_URL in the script matches your deployment
3. Test the endpoint with curl first
4. Check if your app is online and accessible

### Widget Shows Old Data

**Solution**:
1. Long press the widget
2. Pull down to refresh
3. The widget auto-refreshes based on iOS schedule (typically every 15-30 minutes)

### Widget Not Updating

**Solution**:
1. Open the Scriptable app
2. Run the script manually to verify it works
3. Check widget refresh settings in iOS Settings → Scriptable
4. Try removing and re-adding the widget

---

## API Endpoint Details

### Request

**Endpoint**: `GET /api/widget/admin`

**Authentication**: Bearer token (API key from admin account)

**Headers**:
```
Authorization: Bearer gcrm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

### Response Structure

**Success (200 OK):**

```json
{
  "user": {
    "name": "Admin Name",
    "role": "admin"
  },
  "stats": {
    "users": {
      "total": 150,
      "teachers": 25,
      "students": 120,
      "recentNew": 5
    },
    "lessons": {
      "total": 1250,
      "recent30Days": 180,
      "upcoming7Days": 45
    },
    "assignments": {
      "pending": 78
    },
    "songs": {
      "total": 320
    },
    "apiKeys": {
      "active": 12
    }
  },
  "upcomingLessons": [
    {
      "id": "123",
      "date": "2025-12-10",
      "teacher": "John Smith",
      "student": "Alice Johnson"
    }
  ],
  "topTeachers": [
    {
      "name": "John Smith",
      "lessons": 45
    },
    {
      "name": "Jane Doe",
      "lessons": 38
    }
  ],
  "lastUpdated": "2025-12-09T10:30:00.000Z"
}
```

**Error (403 Forbidden):**

```json
{
  "error": "Forbidden. Admin access required."
}
```

**Error (401 Unauthorized):**

```json
{
  "error": "Invalid or missing API key"
}
```

---

## Security Notes

1. **Role Verification**: The endpoint checks for admin role before returning data
2. **API Key Protection**: Keep your API key secure - never share it publicly
3. **Revocation**: You can delete API keys anytime from Settings → API Keys
4. **Access Logs**: API key usage is logged in the database
5. **HTTPS Required**: Always use HTTPS in production (not HTTP)

---

## Comparison: Admin vs Regular Widget

| Feature | Admin Widget | Dashboard Widget |
|---------|-------------|------------------|
| **Endpoint** | `/api/widget/admin` | `/api/widget/dashboard` |
| **Required Role** | Admin only | Teacher/Student |
| **Data Scope** | System-wide statistics | Personal lessons/assignments |
| **User Counts** | ✅ Total, teachers, students | ❌ Not shown |
| **Lesson Stats** | ✅ System-wide totals | ✅ Personal only |
| **Top Teachers** | ✅ Performance leaderboard | ❌ Not shown |
| **Recent Activity** | ✅ 30-day trends | ❌ Not shown |
| **Pending Assignments** | ✅ All users | ✅ Personal only |
| **Recommended Size** | Medium or Large | Medium |

---

## Need Help?

- **Regular Widget**: See [2025-12-09-IOS_WIDGET_SETUP.md](./2025-12-09-IOS_WIDGET_SETUP.md) for teacher/student widget
- **API Keys**: Generate from Settings → API Keys in web app
- **Admin Access**: Contact your Guitar CRM administrator
- **Troubleshooting**: Check the Troubleshooting section above

---

**Last Updated**: December 2025
**Widget Type**: Admin Statistics Dashboard
**Requires**: iOS 14+, Scriptable app, Admin role
