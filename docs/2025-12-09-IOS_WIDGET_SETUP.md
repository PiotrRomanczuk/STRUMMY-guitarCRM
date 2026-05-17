# iOS Scriptable Widget Setup Guide

This guide will help you set up a Guitar CRM widget on your iPhone/iPad using the Scriptable app.

## Prerequisites

1. **iPhone or iPad** running iOS 14 or later
2. **Scriptable app** - Download from [App Store](https://apps.apple.com/us/app/scriptable/id1405459188)
3. **Guitar CRM account** with API key

---

## Step 1: Generate API Key

1. Open Guitar CRM web application
2. Navigate to **Settings** → **API Keys**
3. Click **"Create New API Key"**
4. Enter a name: `iOS Widget`
5. Click **Create**
6. **⚠️ IMPORTANT**: Copy the API key immediately - it will only be shown once!
   - Format: `gcrm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 2: Install Widget Script

1. Open **Scriptable** app on your iPhone/iPad
2. Tap the **+** button (top right) to create a new script
3. Name it: `Guitar CRM Widget`
4. Copy and paste the code below:

```javascript
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: music;

// Guitar CRM Widget for Scriptable
// Shows upcoming lessons and assignments

// Configuration
const API_KEY = args.widgetParameter || 'YOUR_API_KEY_HERE';
const API_URL = 'https://your-app-url.vercel.app/api/widget/dashboard';

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
  widget.backgroundColor = new Color('#1a1a1a');
  widget.setPadding(16, 16, 16, 16);

  try {
    // Fetch data from API
    let req = new Request(API_URL);
    req.headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    let data = await req.loadJSON();

    // Check for error
    if (data.error) {
      return createErrorWidget(widget, data.error);
    }

    // Header
    let header = widget.addStack();
    header.layoutHorizontally();
    
    let icon = header.addText('🎸');
    icon.font = Font.boldSystemFont(16);
    
    header.addSpacer(8);
    
    let title = header.addText('Guitar CRM');
    title.font = Font.boldSystemFont(16);
    title.textColor = Color.white();
    
    header.addSpacer();
    
    let role = header.addText(data.user.role.toUpperCase());
    role.font = Font.boldSystemFont(10);
    role.textColor = new Color('#888888');
    
    widget.addSpacer(12);

    // Upcoming Lessons
    if (data.lessons && data.lessons.length > 0) {
      let lessonsTitle = widget.addText('📅 Upcoming Lessons');
      lessonsTitle.font = Font.boldSystemFont(12);
      lessonsTitle.textColor = new Color('#4a9eff');
      widget.addSpacer(6);

      for (let i = 0; i < Math.min(3, data.lessons.length); i++) {
        let lesson = data.lessons[i];
        let lessonStack = widget.addStack();
        lessonStack.layoutHorizontally();
        
        let date = new Date(lesson.date);
        let dateText = lessonStack.addText(formatDate(date));
        dateText.font = Font.systemFont(11);
        dateText.textColor = Color.white();
        
        lessonStack.addSpacer(8);
        
        if (lesson.with) {
          let withText = lessonStack.addText(`with ${lesson.with}`);
          withText.font = Font.systemFont(11);
          withText.textColor = new Color('#cccccc');
          withText.lineLimit = 1;
        }
        
        widget.addSpacer(4);
      }
    } else {
      let noLessons = widget.addText('No upcoming lessons');
      noLessons.font = Font.systemFont(11);
      noLessons.textColor = new Color('#888888');
    }

    widget.addSpacer(12);

    // Pending Assignments (students only)
    if (data.assignments && data.assignments.length > 0) {
      let assignmentsTitle = widget.addText('✓ Pending Assignments');
      assignmentsTitle.font = Font.boldSystemFont(12);
      assignmentsTitle.textColor = new Color('#ff9500');
      widget.addSpacer(6);

      for (let i = 0; i < Math.min(2, data.assignments.length); i++) {
        let assignment = data.assignments[i];
        let assignmentStack = widget.addStack();
        assignmentStack.layoutHorizontally();
        
        let statusIcon = assignment.status === 'in_progress' ? '⏳' : '🎵';
        let icon = assignmentStack.addText(statusIcon);
        icon.font = Font.systemFont(11);
        
        assignmentStack.addSpacer(6);
        
        let songText = assignmentStack.addText(assignment.song);
        songText.font = Font.systemFont(11);
        songText.textColor = Color.white();
        songText.lineLimit = 1;
        
        widget.addSpacer(4);
      }
    }

    widget.addSpacer();

    // Footer - Last updated
    let footer = widget.addText(`Updated ${formatTime(new Date())}`);
    footer.font = Font.systemFont(9);
    footer.textColor = new Color('#666666');
    footer.rightAlignText();

  } catch (error) {
    return createErrorWidget(widget, error.message);
  }

  return widget;
}

// Error widget
function createErrorWidget(widget, errorMsg) {
  widget.backgroundColor = new Color('#2a1a1a');
  
  let icon = widget.addText('⚠️');
  icon.font = Font.boldSystemFont(24);
  widget.addSpacer(8);
  
  let title = widget.addText('Connection Error');
  title.font = Font.boldSystemFont(14);
  title.textColor = new Color('#ff6b6b');
  widget.addSpacer(8);
  
  let error = widget.addText(errorMsg);
  error.font = Font.systemFont(10);
  error.textColor = new Color('#cccccc');
  error.minimumScaleFactor = 0.8;
  
  return widget;
}

// Helper functions
function formatDate(date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
  }
}

function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
```

5. Tap **Done** to save

---

## Step 3: Configure Widget

### Method A: Widget Parameter (Recommended)

1. Long press on your home screen
2. Tap the **+** button (top left)
3. Search for **Scriptable**
4. Select **Medium** widget size
5. Tap **Add Widget**
6. Long press the widget → **Edit Widget**
7. In **Script** dropdown, select **Guitar CRM Widget**
8. In **Parameter** field, paste your API key: `gcrm_xxxx...`
9. Tap outside to save

### Method B: Edit Script (Alternative)

1. Open Scriptable app
2. Tap on **Guitar CRM Widget** script
3. Find line: `const API_KEY = args.widgetParameter || 'YOUR_API_KEY_HERE';`
4. Replace `YOUR_API_KEY_HERE` with your actual API key
5. Find line: `const API_URL = 'https://your-app-url.vercel.app/api/widget/dashboard';`
6. Replace with your actual API URL
7. Tap **Done**

---

## Step 5: Add Widget to Home Screen

1. Long press on your home screen
2. Tap the **+** button
3. Search for **Scriptable**
4. Select widget size:
   - **Small**: Next lesson only
   - **Medium**: Lessons + assignments (recommended)
   - **Large**: Full weekly view
5. Tap **Add Widget**
6. Long press widget → **Edit Widget**
7. Select **Guitar CRM Widget** from Script dropdown
8. Tap outside to save

---

## Widget Features

### What It Shows

**For Teachers:**
- 📅 Next 3 upcoming lessons with student names
- 🕐 Lesson dates and times
- 📝 Lesson notes preview

**For Students:**
- 📅 Next 3 upcoming lessons with teacher names
- ✓ Pending assignments (up to 2)
- 🎵 Song assignments with status

### Refresh Behavior

- **Automatic**: Widget refreshes based on iOS background refresh schedule (typically every 15-30 minutes)
- **Manual**: Tap the widget to open Scriptable and see updated data
- **On Unlock**: Widget may refresh when you unlock your phone

---

## Troubleshooting

### Problem: "Connection Error" or "Invalid API Key"

**Solution:**
1. Verify your API key is correct (no extra spaces)
2. Check that API key is still active in web app (Settings → API Keys)
3. Ensure you have internet connection
4. Try regenerating API key if compromised

### Problem: Widget shows old data

**Solution:**
1. Tap the widget to force refresh
2. Remove and re-add the widget
3. Check iOS Settings → General → Background App Refresh → enable for Scriptable

### Problem: "Unauthorized" error

**Solution:**
1. Make sure you copied the FULL API key including `gcrm_` prefix
2. Verify key hasn't been deleted in web app
3. Check that you pasted the key correctly (no line breaks)

### Problem: Widget appears blank

**Solution:**
1. Open Scriptable app
2. Tap on **Guitar CRM Widget**
3. Tap the play button (▶️) to test
4. Check for errors in the log
5. Verify API_URL is correct (should match your deployment URL)

---

## Security Best Practices

### ✅ DO:
- Treat API keys like passwords
- Use descriptive names for keys ("iOS Widget - iPhone 14")
- Delete unused keys regularly
- Regenerate keys if you suspect compromise

### ❌ DON'T:
- Share API keys with others
- Post API keys in screenshots or videos
- Use the same key on multiple devices (create separate keys)
- Hardcode keys in shared scripts

### If Compromised:
1. Go to Guitar CRM → Settings → API Keys
2. Find the compromised key
3. Click **Disable** or **Delete**
4. Generate a new key
5. Update widget parameter with new key

---

## Advanced Configuration

### Customize Refresh Interval

Edit the script and add at the top:
```javascript
// Configure refresh (in minutes)
const REFRESH_INTERVAL = 30;
widget.refreshAfterDate = new Date(Date.now() + REFRESH_INTERVAL * 60 * 1000);
```

### Change Widget Colors

Find these lines and modify:
```javascript
widget.backgroundColor = new Color('#1a1a1a'); // Dark background
lessonsTitle.textColor = new Color('#4a9eff'); // Blue for lessons
assignmentsTitle.textColor = new Color('#ff9500'); // Orange for assignments
```

### Adjust Data Limits

Modify these numbers in the script:
```javascript
for (let i = 0; i < Math.min(3, data.lessons.length); i++) {
// Change 3 to show more/fewer lessons

for (let i = 0; i < Math.min(2, data.assignments.length); i++) {
// Change 2 to show more/fewer assignments
```

---

## API Endpoint Details

**Endpoint**: `GET /api/widget/dashboard`

**Authentication**: Bearer token (API key)

**Headers**:
```
Authorization: Bearer gcrm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

**Response Format**:
```json
{
  "user": {
    "name": "John Doe",
    "role": "teacher"
  },
  "lessons": [
    {
      "id": "uuid",
      "date": "2025-12-10",
      "notes": "Practice scales",
      "with": "Student Name"
    }
  ],
  "assignments": [
    {
      "id": "uuid",
      "dueDate": "2025-12-15",
      "status": "in_progress",
      "song": "Wonderwall - Oasis"
    }
  ],
  "lastUpdated": "2025-12-09T14:30:00.000Z"
}
```

### Admin Widget Endpoint

**Endpoint**: `GET /api/widget/admin`

**Authentication**: Bearer token (API key) - User must have admin role

**Headers**:

```
Authorization: Bearer gcrm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Content-Type: application/json
```

**Response** (200 OK):

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

**Error Response** (403 Forbidden):

```json
{
	"error": "Forbidden. Admin access required."
}
```

---

## Testing with curl

Test your API key from Terminal:

```bash
curl -H "Authorization: Bearer gcrm_YOUR_API_KEY_HERE" \
     https://your-app-url.vercel.app/api/widget/dashboard
```

You should see JSON response with your lessons and assignments.

---

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Test API key with curl command
3. Verify API key is active in Guitar CRM settings
4. Check Scriptable app logs for errors
5. Ensure you're running latest version of Scriptable

---

## Version History

- **v1.0** (2025-12-09): Initial release
  - Teacher/Student role support
  - Upcoming lessons (7 days)
  - Pending assignments
  - Medium widget layout

---

**Enjoy your Guitar CRM widget! 🎸**
