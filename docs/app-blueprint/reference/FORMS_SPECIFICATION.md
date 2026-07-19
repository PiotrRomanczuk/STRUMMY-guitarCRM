# Guitar CRM - Forms Specification for UI Builder

## Overview

This document provides complete specifications for all 13 forms in the Guitar CRM application. Each form is described with full details including fields, validation rules, special features, actions, layout, navigation, error handling, and success states.

The application uses:
- **UI Framework**: Tailwind CSS 4 with dark mode support
- **Validation**: Zod schemas with field-level and form-level validation
- **Validation Strategy**: Validate on blur, clear errors on change
- **Component Library**: shadcn/ui components (Input, Button, Label, Select, Textarea, Checkbox, etc.)
- **Icons**: Lucide React
- **Form Behavior**: All forms are client-side React components with controlled inputs
- **Spacing**: Consistent `space-y-*` classes for vertical stacking

---

## 1. SignInForm

### Purpose
Authenticate existing users with email/password or Google OAuth.

### User Context
All users (admin/teacher/student) - public access before authentication.

### Fields

1. **Email**
   - Type: `email`
   - Label: "Email"
   - Placeholder: "you@example.com"
   - Validation:
     - Required
     - Valid email format
   - Error messages:
     - "Valid email required"
   - Default value: Empty string
   - Field spacing: `space-y-2`

2. **Password**
   - Type: `password` (with visibility toggle)
   - Label: "Password"
   - Placeholder: None
   - Validation:
     - Required
     - Minimum 1 character
   - Error messages:
     - "Password is required"
   - Default value: Empty string
   - Special features:
     - Toggle visibility button (Eye/EyeOff icon) at right side of input
     - Button positioned absolutely: `absolute right-3 top-1/2 -translate-y-1/2`
     - Button ARIA label: "Show password" / "Hide password"
     - Input has `pr-10` padding to accommodate icon
   - Helper text: "Forgot password?" link (positioned top-right of label)
   - Field spacing: `space-y-2`

### Special Features

1. **Google OAuth Button**
   - Text: "Continue with Google"
   - Style: Outline variant, full width
   - Icon: Google logo SVG (multicolor: #4285F4, #34A853, #FBBC05, #EA4335)
   - Icon size: `h-5 w-5 mr-2`
   - Positioned before email/password fields

2. **OR Divider**
   - Visual separator between Google OAuth and email/password
   - Structure:
     - Full-width horizontal line with centered "OR" text
     - Background: `bg-card`
     - Text color: `text-muted-foreground`
     - Border: `border-t border-border`

3. **Validation Timing**
   - Validate on blur
   - Clear errors when user starts typing
   - Mark fields as touched on blur
   - Show errors only for touched fields

### Actions

1. **Primary Button: "Continue"**
   - Type: `submit`
   - Style: Default button style, full width
   - Disabled when: Loading or form not hydrated
   - Loading state text: "Signing in..."
   - Loading state: Shows text only (no spinner icon in this form)
   - Test ID: `signin-button`

2. **"Forgot password?" Link**
   - Location: Top-right of password label
   - Href: `/forgot-password`
   - Style: `text-sm text-muted-foreground hover:text-primary transition-colors`

3. **"Create your account" Link**
   - Location: Footer section below submit button
   - Text: "Don't have an account? Create your account"
   - Href: `/sign-up`
   - Style: `text-primary hover:underline font-medium`

### Layout

```
<Google OAuth Button> (full width)

--- OR divider ---

<Email Field> (space-y-2)
  <Label>
  <Input>
  <Error message if present>

<Password Field> (space-y-2)
  <Label with "Forgot password?" link>
  <Input with visibility toggle>
  <Error message if present>

<Form-level error alert if present>

<Continue Button> (full width)

<Footer>
  "Don't have an account? Create your account"
</Footer>
```

- Container: `space-y-6`
- Google OAuth section: `space-y-4`
- Form fields: `space-y-6`

### Navigation

- Success redirect: `/dashboard`
- "Forgot password?" → `/forgot-password`
- "Create your account" → `/sign-up`

### Error Handling

1. **Field-level errors**
   - Display below each input
   - Style: `text-sm text-destructive`
   - Role: `alert`
   - Border color changes to `border-destructive`
   - ARIA invalid: `aria-invalid={!!error}`

2. **Form-level errors**
   - Component: `FormAlert` with `type="error"`
   - Positioned between password field and submit button
   - Special case: "Invalid login credentials" becomes:
     - "Invalid email or password. If you haven't set a password yet, please use 'Forgot password?' to create one."

3. **Validation errors**
   - Only shown for touched fields
   - Cleared when user starts typing

### Success State

- Clear email and password fields
- Clear touched state
- Clear field errors
- Call `onSuccess` callback if provided
- User is redirected by auth system to `/dashboard`

---

## 2. SignUpForm

### Purpose
Register new users with email/password or Google OAuth.

### User Context
New users - public access before authentication.

### Fields

1. **First Name**
   - Type: `text`
   - Label: "First Name"
   - Placeholder: None
   - Validation:
     - Required
     - Minimum 1 character
     - Maximum 100 characters
   - Error messages:
     - "First name is required"
     - "First name too long"
   - Default value: Empty string
   - Layout: Left column in 2-column grid on sm+ screens
   - Field spacing: `space-y-2`

2. **Last Name**
   - Type: `text`
   - Label: "Last Name"
   - Placeholder: None
   - Validation:
     - Required
     - Minimum 1 character
     - Maximum 100 characters
   - Error messages:
     - "Last name is required"
     - "Last name too long"
   - Default value: Empty string
   - Layout: Right column in 2-column grid on sm+ screens
   - Field spacing: `space-y-2`

3. **Email Address**
   - Type: `email`
   - Label: "Email Address"
   - Placeholder: "you@example.com"
   - Validation:
     - Required
     - Valid email format
   - Error messages:
     - "Valid email required"
   - Default value: Empty string
   - Field spacing: `space-y-2`

4. **Password**
   - Type: `password`
   - Label: "Password"
   - Placeholder: None
   - Validation:
     - Required
     - Minimum 6 characters
   - Error messages:
     - "Password must be at least 6 characters"
   - Default value: Empty string
   - Special features:
     - Password strength indicator (shows when no error)
     - Strength bar with color coding (weak=red, medium=yellow, strong=green)
     - Requirements checklist (5 criteria)
   - HTML attributes: `minLength={6}`
   - Field spacing: `space-y-2`

5. **Confirm Password**
   - Type: `password`
   - Label: "Confirm Password"
   - Placeholder: None
   - Validation:
     - Required
     - Minimum 6 characters
     - Must match password field
   - Error messages:
     - "Passwords don't match"
   - Default value: Empty string
   - Special features:
     - Real-time match indicator when field has value
     - Green checkmark + "Passwords match" when matches
     - Red X + "Passwords do not match" when doesn't match
   - HTML attributes: `minLength={6}`
   - Field spacing: `space-y-2`

### Special Features

1. **Name Fields Grid**
   - Container: `grid grid-cols-1 sm:grid-cols-2 gap-4`
   - First name and last name side-by-side on sm+ screens
   - Stacked on mobile

2. **Password Strength Indicator**
   - Shows below password field when password has value and no error
   - Component: `PasswordStrengthIndicator`
   - Displays:
     - Strength bar (weak/medium/strong)
     - Percentage-based width
     - Color coding:
       - Weak: `bg-destructive`
       - Medium: `bg-warning`
       - Strong: `bg-success`
   - Requirements checklist:
     - At least 6 characters
     - Contains uppercase letter
     - Contains lowercase letter
     - Contains number
     - Contains special character
   - Each requirement shows checkmark (green) or circle (gray)

3. **Password Match Indicator**
   - Shows below confirm password field when field has value
   - Icon + text combination
   - Match state:
     - Icon: CheckCircle2 (`h-4 w-4 text-success`)
     - Text: "Passwords match" (`text-success`)
   - No match state:
     - Icon: AlertCircle (`h-4 w-4 text-destructive`)
     - Text: "Passwords do not match" (`text-destructive`)
   - Style: `flex items-center gap-2 text-xs`

4. **Email Verification Success Alert**
   - Shows after successful signup
   - Component: `Alert` with custom success styling
   - Icon: Mail (`h-4 w-4 text-success`)
   - Border: `border-success/50`
   - Background: `bg-success/10`
   - Content:
     - Title: "Verification Email Sent!"
     - User's email in bold
     - Numbered instructions (1. Check inbox, 2. Click link, 3. Sign in)
     - Resend email button (with 60-second countdown)
   - Resend button:
     - Appears after initial send
     - Disabled during countdown
     - Text changes based on state:
       - "Resend available in Xs"
       - "Sending..."
       - "Didn't receive the email? Resend Verification Email"

5. **Google OAuth Button**
   - Text: "Continue with Google"
   - Style: Outline variant, full width
   - Icon: Same multicolor Google logo as SignInForm
   - Positioned AFTER email fields and submit button
   - Separator: "Or continue with" divider above it

6. **Field Order**
   - First/Last name grid
   - Email
   - Password (with strength indicator)
   - Confirm password (with match indicator)
   - Form-level error/success alerts
   - Sign Up button
   - Google OAuth divider
   - Google OAuth button
   - Footer links

### Actions

1. **Primary Button: "Sign Up"**
   - Type: `submit`
   - Style: Default button style, full width
   - Disabled when: Loading
   - Loading state text: "Signing up..."
   - Loading state: Shows text only (no spinner)

2. **Resend Verification Email Button**
   - Type: `button`
   - Only visible in success alert
   - Disabled when: Loading or countdown active
   - Text varies by state (see Special Features)
   - Style: `text-sm text-success underline hover:text-success/80`

3. **Google OAuth Button**
   - Same as SignInForm
   - Positioned after form

4. **"Sign in" Link**
   - Location: Footer below Google button
   - Text: "Already have an account? Sign in"
   - Href: `/sign-in`
   - Style: `text-primary hover:underline font-medium`

### Layout

```
<Name Grid> (grid grid-cols-1 sm:grid-cols-2 gap-4)
  <First Name Field>
  <Last Name Field>

<Email Field>

<Password Field>
  <Password Strength Indicator if showing>

<Confirm Password Field>
  <Password Match Indicator if showing>

<Form-level error alert if present>
<Success alert if present>

<Sign Up Button>

--- "Or continue with" divider ---

<Google OAuth Button>

<Footer>
  "Already have an account? Sign in"
</Footer>
```

- Form container: `space-y-6`

### Navigation

- Success: Shows verification email alert, stays on page
- "Sign in" link → `/sign-in`
- After email verification → user signs in at `/sign-in`

### Error Handling

1. **Field-level errors**
   - Same pattern as SignInForm
   - Display below each input
   - Style: `text-sm text-destructive`
   - Border changes to `border-destructive`

2. **Form-level errors**
   - Component: `FormAlert` with `type="error"`
   - Positioned before submit button

3. **Password validation**
   - Real-time strength indicator (positive reinforcement)
   - Error only shows on blur for failed validation

### Success State

- Shows success alert with email verification instructions
- Form remains filled (doesn't clear)
- Submit button remains disabled after success
- User can resend verification email if needed
- Success alert auto-displays, doesn't auto-hide

---

## 3. ForgotPasswordForm

### Purpose
Send password reset email to users who forgot their password.

### User Context
All users - public access.

### Fields

1. **Email**
   - Type: `email`
   - Label: "Email"
   - Placeholder: "you@example.com"
   - Validation:
     - Required
     - Valid email format
   - Error messages:
     - "Valid email required"
   - Default value: Empty string
   - Field spacing: `space-y-2`

### Special Features

1. **Instructional Text**
   - Position: Above email field
   - Text: "Enter your email and we'll send you a reset link"
   - Style: `text-sm text-muted-foreground text-center`

2. **Simple Single-Field Form**
   - Minimal design
   - Focus on email input only

### Actions

1. **Primary Button: "Send Reset Link"**
   - Type: `submit`
   - Style: Default button style, full width
   - Disabled when: Loading
   - Loading state text: "Sending..."

2. **"Back to sign in" Link**
   - Location: Below submit button
   - Href: `/sign-in`
   - Style: `text-sm text-muted-foreground`, `text-primary hover:underline font-medium`
   - Centered text

### Layout

```
<Instructional Text (centered)>

<Email Field> (space-y-2)
  <Label>
  <Input>
  <Error message if present>

<Form-level error alert if present>
<Success alert if present>

<Send Reset Link Button> (full width)

<Footer (centered)>
  "Back to sign in"
</Footer>
```

- Form container: `space-y-6`

### Navigation

- "Back to sign in" → `/sign-in`
- After success: User stays on page, checks email

### Error Handling

1. **Field-level errors**
   - Same pattern as other auth forms
   - Validation on blur

2. **Form-level errors**
   - Component: `FormAlert` with `type="error"`

### Success State

- Shows success alert
- Component: `FormAlert` with `type="success"`
- Message: "Check your email for the reset link"
- Form remains on page
- Email field retains value

---

## 4. ResetPasswordForm

### Purpose
Allow users to set a new password after clicking reset link.

### User Context
Users who clicked password reset link from email.

### Fields

1. **New Password**
   - Type: `password` (with visibility toggle)
   - Label: "New Password"
   - Placeholder: "Enter new password"
   - Validation:
     - Required
     - Minimum 6 characters
   - Error messages:
     - "Password must be at least 6 characters"
   - Default value: Empty string
   - Helper text: "Minimum 6 characters" (shows when no error)
   - Special features:
     - Visibility toggle (Eye/EyeOff icon)
     - Same positioning as SignInForm password
   - HTML attributes: `minLength={6}`
   - Field spacing: `space-y-2`

2. **Confirm Password**
   - Type: `password` (with visibility toggle)
   - Label: "Confirm Password"
   - Placeholder: "Confirm new password"
   - Validation:
     - Required
     - Minimum 6 characters
     - Must match new password
   - Error messages:
     - "Passwords don't match"
   - Default value: Empty string
   - Special features:
     - Visibility toggle (Eye/EyeOff icon)
   - HTML attributes: `minLength={6}`
   - Field spacing: `space-y-2`

### Special Features

1. **Password Visibility Toggles**
   - Both fields have independent toggles
   - Eye icon when hidden, EyeOff icon when visible
   - Positioned absolutely in input: `absolute right-3 top-1/2 -translate-y-1/2`
   - Input padding: `pr-10`
   - ARIA label alternates: "Show password" / "Hide password"

2. **Helper Text**
   - Shows below new password field when no error
   - Text: "Minimum 6 characters"
   - Style: `text-xs text-muted-foreground`

3. **Success Replacement**
   - On success, entire form is replaced with success message
   - Component: `FormAlert` with `type="success"`
   - Title: "Password reset successfully"
   - Message: "Redirecting to dashboard..."
   - Auto-redirect after 2 seconds

### Actions

1. **Primary Button: "Reset Password"**
   - Type: `submit`
   - Style: Default button style, full width
   - Disabled when: Loading
   - Loading state text: "Resetting..."

### Layout

```
<New Password Field> (space-y-2)
  <Label>
  <Input with toggle>
  <Error or helper text>

<Confirm Password Field> (space-y-2)
  <Label>
  <Input with toggle>
  <Error message if present>

<Form-level error alert if present>

<Reset Password Button> (full width)

--- OR ON SUCCESS ---

<Success Alert>
  "Password reset successfully"
  "Redirecting to dashboard..."
</Success Alert>
```

- Form container: `space-y-6`

### Navigation

- Success: Auto-redirect to `/dashboard` after 2 seconds
- Can be overridden with `onSuccess` callback

### Error Handling

1. **Field-level errors**
   - Same pattern as other forms
   - Validation on blur

2. **Form-level errors**
   - Component: `FormAlert` with `type="error"`

### Success State

- Replaces entire form with success alert
- Title: "Password reset successfully"
- Message: "Redirecting to dashboard..."
- Automatic redirect to `/dashboard` after 2000ms delay
- Or calls `onSuccess` callback if provided

---

## 5. LessonForm

### Purpose
Create or edit a lesson with student, date/time, notes, and optional songs.

### User Context
Admin and Teacher only.

### Fields

1. **Lesson Title** (Optional)
   - Type: `text`
   - Label: "Lesson Title (Optional)"
   - Placeholder: "e.g., Introduction to Strumming Patterns"
   - Validation:
     - Optional
     - Minimum 1 character if provided
   - Error messages:
     - "Title is required" (only if schema requires it in edit mode)
   - Default value: Empty string
   - Test ID: `lesson-title`
   - Field spacing: `space-y-2`

2. **Scheduled Date & Time** (Required)
   - Type: `datetime-local`
   - Label: "Scheduled Date & Time *"
   - Required indicator: Red asterisk
   - Placeholder: None (browser-native datetime picker)
   - Validation:
     - Required
     - Valid datetime format
   - Error messages:
     - "Scheduled date & time is required"
   - Default value: Empty string
   - Test ID: `lesson-scheduled-at`
   - Field spacing: `space-y-2`

3. **Status**
   - Type: `select` (shadcn/ui Select component)
   - Label: "Status"
   - Default value: "SCHEDULED"
   - Options:
     - `SCHEDULED` → "Scheduled"
     - `IN_PROGRESS` → "In Progress"
     - `COMPLETED` → "Completed"
     - `CANCELLED` → "Cancelled"
   - Validation:
     - Must be one of enum values
   - Error messages:
     - Standard enum validation error
   - Test ID: `lesson-status`
   - Field spacing: `space-y-2`

4. **Lesson Notes** (Optional)
   - Type: `textarea`
   - Label: "Lesson Notes (Optional)"
   - Placeholder: "Add notes about what was covered, homework assigned, student progress, etc."
   - Rows: 5
   - Validation:
     - Optional
   - Error messages:
     - None (optional field)
   - Default value: Empty string
   - Special features:
     - AI assistance button (if student and songs selected)
     - Non-resizable: `resize-none`
   - Test ID: `lesson-notes`
   - Field spacing: `space-y-2`

### Special Features

1. **AI Lesson Notes Generator**
   - Component: `LessonNotesAI`
   - Position: Top-right of notes label (flex layout)
   - Container: `flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2`
   - Visibility conditions:
     - `studentName` must be available
     - At least one song must be selected
     - Lesson title must have value (disabled if empty)
   - Props passed:
     - `studentName`
     - `songsCovered` (array of song titles)
     - `lessonTopic` (lesson title or fallback "Guitar Lesson")
   - Behavior:
     - Generates notes using AI
     - On generation, populates notes textarea via synthetic change event

2. **Student/Teacher Selection**
   - Not shown in Fields component (handled in parent)
   - Parent form likely has student and teacher dropdowns

3. **Song Selection**
   - Not shown in Fields component (handled in parent)
   - Used to populate AI assistance

### Actions

- Actions are handled by parent form component
- Likely includes: Save, Cancel

### Layout

```
<Lesson Title Field> (space-y-2, optional)

<Scheduled Date & Time Field> (space-y-2, required)

<Status Select> (space-y-2)

<Lesson Notes Field> (space-y-2)
  <Label with AI button on right (sm+)>
  <Textarea (5 rows, non-resizable)>
  <Error if present>
```

- Fields container: `space-y-4 sm:space-y-5`
- Mobile: `space-y-4`
- Desktop: `space-y-5`

### Navigation

- Handled by parent form

### Error Handling

1. **Field-level errors**
   - Standard pattern: `text-sm text-destructive` with `role="alert"`
   - ARIA invalid on field
   - Validation on blur

2. **Field errors clearing**
   - Errors clear when user starts typing (onChange)
   - But only if field was previously touched

### Success State

- Handled by parent form
- Likely redirects to lessons list or lesson detail

---

## 6. AssignmentForm

### Purpose
Create or edit an assignment for a student with title, description, due date, and status.

### User Context
Admin and Teacher only.

### Fields

1. **Title** (Required)
   - Type: `text`
   - Label: "Title *"
   - Required indicator: Red asterisk
   - Placeholder: "Assignment title"
   - Validation:
     - Required
     - Minimum 1 character
     - Maximum 200 characters
   - Error messages:
     - "Title is required"
   - Default value: Empty string
   - Test ID: `field-title`
   - Field spacing: `space-y-2`

2. **Description**
   - Type: `textarea`
   - Label: "Description"
   - Placeholder: "Assignment description"
   - Rows: 6
   - Validation:
     - Optional
     - Maximum 2000 characters
   - Error messages:
     - "Description too long" (if exceeds max)
   - Default value: Empty string
   - Special features:
     - AI assistance button (if student selected and title provided)
   - Test ID: `field-description`
   - Field spacing: `space-y-2`

3. **Student**
   - Type: `select` (shadcn/ui Select)
   - Label: "Student"
   - Placeholder: "Select a student"
   - Validation:
     - Required (UUID)
   - Error messages:
     - Standard select validation
   - Options: Dynamic list from students array
     - Display: `student.full_name || student.email`
     - Value: `student.id`
   - Visibility: Only if students array has items
   - Test ID: `student-select`
   - Field spacing: `space-y-2`

4. **Due Date**
   - Type: `date` (HTML5 date input)
   - Label: "Due Date"
   - Placeholder: None (browser-native)
   - Validation:
     - Optional datetime ISO string
   - Error messages:
     - Standard date validation
   - Value transformation: Split on 'T' and take first part for display
   - Default value: Empty string
   - Test ID: `field-due-date`
   - Field spacing: `space-y-2`

5. **Status**
   - Type: `select` (shadcn/ui Select)
   - Label: "Status"
   - Placeholder: "Select status"
   - Default value: "not_started"
   - Options:
     - `not_started` → "Not Started"
     - `in_progress` → "In Progress"
     - `completed` → "Completed"
     - `overdue` → "Overdue"
     - `cancelled` → "Cancelled"
   - Validation:
     - Must be valid enum value
   - Error messages:
     - Standard enum validation
   - Test ID: `field-status`
   - Field spacing: `space-y-2`

### Special Features

1. **AI Assignment Generator**
   - Component: `AssignmentAI`
   - Position: Top-right of description label
   - Container: `flex justify-between items-center`
   - Visibility conditions:
     - `selectedStudent` must be available
     - Title must have value (disabled if empty)
   - Props:
     - `studentName`: From selected student (full_name or email)
     - `studentLevel`: "intermediate" (default, could be enhanced)
     - `recentSongs`: Array of song titles
     - `focusArea`: Assignment title
     - `duration`: Calculated from due date (e.g., "7 days")
     - `lessonTopic`: Optional lesson context
   - Behavior:
     - Generates assignment description
     - Populates description field via onChange callback

2. **Duration Calculation**
   - Helper function: `getDuration()`
   - Calculates days between now and due date
   - Returns: "X days" or "1 week" as fallback
   - Used for AI context

3. **Field Order**
   - Title first
   - Description with AI button
   - Student select (conditional)
   - Due date
   - Status

### Actions

- Handled by parent form
- Likely includes: Save, Cancel

### Layout

```
<Title Field> (space-y-2, required)

<Description Field> (space-y-2)
  <Label with AI button>
  <Textarea (6 rows)>
  <Error if present>

<Student Select> (space-y-2, conditional)
  If students.length > 0

<Due Date Field> (space-y-2)

<Status Select> (space-y-2)
```

- Fields rendered as fragment (`<>...</>`)
- Parent provides spacing

### Navigation

- Handled by parent form

### Error Handling

1. **Field-level errors**
   - Standard pattern
   - ARIA invalid attributes
   - Validation on blur

2. **onChange handler**
   - Custom onChange takes (name, value) instead of event
   - Parent manages form state

### Success State

- Handled by parent form

---

## 7. AssignmentTemplateForm

### Purpose
Create or edit reusable assignment templates (title and description only).

### User Context
Teachers only - for creating assignment templates.

### Fields

1. **Title** (Required)
   - Type: `text`
   - Label: "Title *"
   - Required indicator: Red asterisk
   - Placeholder: "Template title"
   - Validation:
     - Required
   - Error messages:
     - Schema validation errors
   - Default value: `initialData?.title` or empty string
   - HTML required: `true`
   - Field spacing: `space-y-2`

2. **Description**
   - Type: `textarea` (shadcn/ui Textarea)
   - Label: "Description"
   - Placeholder: "Template description (optional)"
   - Rows: 4
   - Validation:
     - Optional
   - Error messages:
     - Schema validation errors
   - Default value: `initialData?.description` or empty string
   - Field spacing: `space-y-2`

### Special Features

1. **Mode Support**
   - Props: `mode: 'create' | 'edit'`
   - Changes submit button text
   - Different server actions based on mode

2. **Server Actions**
   - Create: `createAssignmentTemplate`
   - Edit: `updateAssignmentTemplate`

3. **Form Validation**
   - Custom hook: `useTemplateForm`
   - Validates before submit
   - Sets field errors if validation fails

### Actions

1. **Cancel Button**
   - Type: `button`
   - Variant: `outline`
   - onClick: `router.back()`
   - Disabled when: Loading
   - Text: "Cancel"

2. **Submit Button**
   - Type: `submit`
   - Variant: Default
   - Disabled when: Loading
   - Loading state text: "Saving..."
   - Create mode text: "Create Template"
   - Edit mode text: "Update Template"

3. **Button Layout**
   - Container: `flex justify-end gap-4`
   - Cancel on left, Submit on right

### Layout

```
<Form> (space-y-6, max-w-2xl)

  <Form-level error alert if present>

  <Title Field> (space-y-2, required)
    <Label with asterisk>
    <Input>
    <Error if present>

  <Description Field> (space-y-2)
    <Label>
    <Textarea (4 rows)>
    <Error if present>

  <Action Buttons> (flex justify-end gap-4)
    <Cancel Button (outline)>
    <Submit Button>
  </Action Buttons>

</Form>
```

- Form container: `space-y-6 max-w-2xl`

### Navigation

- Cancel: `router.back()`
- Success: `router.push('/dashboard/assignments/templates')` + `router.refresh()`

### Error Handling

1. **Field-level errors**
   - Managed by `useTemplateForm` hook
   - Validated on blur
   - Display: `text-sm text-destructive`

2. **Form-level errors**
   - Component: `Alert` variant="destructive"
   - Icon: AlertCircle
   - Shows validation or save errors

3. **Pre-submit validation**
   - Validates all fields before submit
   - Sets form-level error: "Please fix the validation errors"
   - Prevents submission if errors exist

### Success State

- Navigate to templates list: `/dashboard/assignments/templates`
- Refresh router to show updated data
- No success message (navigation indicates success)

---

## 8. SongForm

### Purpose
Create or edit a song with comprehensive metadata including links, images, and musical details.

### User Context
Admin and Teacher - for managing song library.

### Fields

1. **Spotify Search** (Special Component)
   - Component: `SpotifySearch`
   - Position: First in form
   - Purpose: Auto-fill song data from Spotify
   - Callback: `onSpotifySelect(track)`

2. **Title** (Required)
   - Type: `text`
   - Label: "Title"
   - Validation:
     - Required
     - Minimum 1 character
     - Maximum 200 characters
   - Error messages:
     - "Title is required"
     - "Title too long"
   - Component: `SongFormFieldText`

3. **Author** (Required)
   - Type: `text`
   - Label: "Author"
   - Validation:
     - Required
     - Minimum 1 character
     - Maximum 100 characters
   - Error messages:
     - "Author is required"
     - "Author name too long"
   - Component: `SongFormFieldText`

4. **Difficulty Level** (Required)
   - Type: `select`
   - Label: "Difficulty Level"
   - Options:
     - `beginner` → "Beginner"
     - `intermediate` → "Intermediate"
     - `advanced` → "Advanced"
   - Validation:
     - Required enum value
   - Component: `SongFormFieldSelect`
   - Layout: Left column in 2-column grid

5. **Musical Key** (Required)
   - Type: `select`
   - Label: "Musical Key"
   - Options: 24 keys (C, C#, D, D#, E, F, F#, G, G#, A, A#, B + minor variants)
   - Validation:
     - Required enum value
   - Component: `SongFormFieldSelect`
   - Layout: Right column in 2-column grid

6. **Ultimate Guitar Link**
   - Type: `url`
   - Label: "Ultimate Guitar Link"
   - Validation:
     - Optional
     - Valid URL or empty string
   - Component: `SongFormFieldText`

7. **YouTube URL**
   - Type: `url`
   - Label: "YouTube URL"
   - Placeholder: "https://youtube.com/watch?v=..."
   - Validation:
     - Optional
     - Valid URL or empty string
   - Component: `SongFormFieldText`

8. **Spotify Link**
   - Type: `url`
   - Label: "Spotify Link"
   - Placeholder: "https://open.spotify.com/track/..."
   - Validation:
     - Optional
     - Valid URL or empty string
   - Component: `SongFormFieldText`

9. **TikTok Short URL (Practice)**
   - Type: `url`
   - Label: "TikTok Short URL (Practice)"
   - Placeholder: "https://www.tiktok.com/@user/video/..."
   - Validation:
     - Optional
     - Valid URL or empty string
   - Component: `SongFormFieldText`

10. **Capo Fret**
    - Type: `number`
    - Label: "Capo Fret"
    - Placeholder: "0"
    - Validation:
      - Optional
      - Integer
      - Min: 0, Max: 20
    - Component: `SongFormFieldText`
    - Layout: Left column in 2-column grid

11. **Category**
    - Type: `text`
    - Label: "Category"
    - Placeholder: "e.g. Rock, Pop, Folk"
    - Validation:
      - Optional
      - Maximum 50 characters
    - Component: `SongFormFieldText`
    - Layout: Right column in 2-column grid

12. **Tempo (BPM)**
    - Type: `number`
    - Label: "Tempo (BPM)"
    - Placeholder: "120"
    - Validation:
      - Optional
      - Integer
      - Min: 0, Max: 300
    - Component: `SongFormFieldText`
    - Layout: Left column in 2-column grid (row 2)

13. **Time Signature**
    - Type: `number`
    - Label: "Time Signature"
    - Placeholder: "4"
    - Validation:
      - Optional
      - Integer
      - Min: 1, Max: 16
    - Component: `SongFormFieldText`
    - Layout: Right column in 2-column grid (row 2)

14. **Duration (ms)**
    - Type: `number`
    - Label: "Duration (ms)"
    - Placeholder: "240000"
    - Validation:
      - Optional
      - Integer
      - Min: 0
    - Component: `SongFormFieldText`
    - Layout: Left column in 2-column grid (row 3)

15. **Release Year**
    - Type: `number`
    - Label: "Release Year"
    - Placeholder: "1995"
    - Validation:
      - Optional
      - Integer
      - Min: 1500, Max: 2100
    - Component: `SongFormFieldText`
    - Layout: Right column in 2-column grid (row 3)

16. **Strumming Pattern**
    - Type: `text`
    - Label: "Strumming Pattern"
    - Placeholder: "D DU UDU"
    - Validation:
      - Optional
      - Maximum 100 characters
    - Component: `SongFormFieldText`

17. **Gallery Images**
    - Type: Custom image upload component
    - Label: "Gallery Images"
    - Component: `ImageUpload`
    - Special features:
      - Upload multiple images
      - Set cover image (star icon)
      - Shows cover image selection
    - Helper text: "Upload images for the song gallery. Click the star icon to set an image as the cover."
    - Value: Array of image URLs
    - Cover value: Single URL string

18. **Chords**
    - Type: `text`
    - Label: "Chords"
    - Placeholder: "Em7 G D C"
    - Validation:
      - Optional
    - Component: `SongFormFieldText`

19. **Short Title**
    - Type: `text`
    - Label: "Short Title"
    - Placeholder: "Brief title"
    - Validation:
      - Optional
      - Maximum 50 characters
    - Error messages:
      - "Short title too long"
    - Component: `SongFormFieldText`

### Special Features

1. **Spotify Integration**
   - `SpotifySearch` component at top
   - Auto-populates fields when track selected
   - Fills: title, author, spotify link, duration, tempo, key, release year, etc.

2. **Grid Layouts**
   - Multiple 2-column grids: `grid grid-cols-1 sm:grid-cols-2 gap-4`
   - Level + Key
   - Capo + Category
   - Tempo + Time Signature
   - Duration + Release Year

3. **Image Upload**
   - Custom `ImageUpload` component
   - Multiple image support
   - Cover image selection
   - Gallery management

4. **Field Organization**
   - Basic info (title, author)
   - Difficulty and music theory (level, key)
   - External links (4 URL fields)
   - Music details (capo, category, tempo, time signature, duration, year)
   - Performance info (strumming pattern)
   - Media (gallery images)
   - Additional (chords, short title)

### Actions

- Handled by parent form component
- Likely: Save, Cancel

### Layout

```
<Spotify Search>

<Title> (required)

<Author> (required)

<Grid 2-col>
  <Difficulty Level> (required)
  <Musical Key> (required)
</Grid>

<Ultimate Guitar Link>

<YouTube URL>

<Spotify Link>

<TikTok Short URL>

<Grid 2-col>
  <Capo Fret>
  <Category>
</Grid>

<Grid 2-col>
  <Tempo (BPM)>
  <Time Signature>
</Grid>

<Grid 2-col>
  <Duration (ms)>
  <Release Year>
</Grid>

<Strumming Pattern>

<Gallery Images>
  <ImageUpload with cover selection>
  <Helper text>

<Chords>

<Short Title>
```

- Fields container: `space-y-4`

### Navigation

- Handled by parent form

### Error Handling

1. **Field-level errors**
   - Each field component handles its own error display
   - `SongFormFieldText` and `SongFormFieldSelect` show errors

2. **Validation on blur**
   - `onBlur` callback for each field

### Success State

- Handled by parent form

---

## 9. UserForm

### Purpose
Create or edit user profiles with roles and status.

### User Context
Admin only - for user management.

### Fields

1. **First Name**
   - Type: `text`
   - Label: "First Name"
   - Validation:
     - Optional in schema but recommended
   - Error messages:
     - Schema validation errors
   - Test ID: `firstName-input`
   - Layout: Left column in 2-column grid
   - Field spacing: `space-y-2`

2. **Last Name**
   - Type: `text`
   - Label: "Last Name"
   - Validation:
     - Optional in schema but recommended
   - Error messages:
     - Schema validation errors
   - Test ID: `lastName-input`
   - Layout: Right column in 2-column grid
   - Field spacing: `space-y-2`

3. **Email**
   - Type: `email`
   - Label: "Email" or "Email (Optional)" if shadow user
   - Placeholder:
     - If shadow: "No email required for shadow user"
     - Else: "user@example.com"
   - Validation:
     - Required if NOT shadow user
     - Valid email format or empty string
   - Error messages:
     - "Valid email is required"
   - Required: `!formData.isShadow`
   - Test ID: `email-input`
   - Layout: Left column in 2-column grid
   - Field spacing: `space-y-2`

4. **Username**
   - Type: `text`
   - Label: "Username"
   - Validation:
     - Optional
   - Test ID: `username-input`
   - Layout: Right column in 2-column grid
   - Field spacing: `space-y-2`

5. **Shadow User** (Checkbox)
   - Type: `checkbox`
   - Label: "Shadow User (No login access, email optional)"
   - Default: `false`
   - Test ID: `isShadow-checkbox`
   - Layout: Grid item in 2x2 role/status grid
   - Special: Changes email requirement

6. **Admin** (Checkbox)
   - Type: `checkbox`
   - Label: "Admin"
   - Default: `false`
   - Test ID: `isAdmin-checkbox`
   - Layout: Grid item in role/status grid

7. **Teacher** (Checkbox)
   - Type: `checkbox`
   - Label: "Teacher"
   - Default: `false`
   - Test ID: `isTeacher-checkbox`
   - Layout: Grid item in role/status grid

8. **Student** (Checkbox)
   - Type: `checkbox`
   - Label: "Student"
   - Default: `false`
   - Test ID: `isStudent-checkbox`
   - Layout: Grid item in role/status grid

9. **Active User** (Checkbox)
   - Type: `checkbox`
   - Label: "Active User"
   - Default: `true`
   - Test ID: `isActive-checkbox`
   - Layout: Standalone below role grid
   - Style: `font-medium` label

### Special Features

1. **Role Grid**
   - Container: `grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted`
   - Contains 4 role/status checkboxes
   - Bordered and highlighted background
   - Title: "Roles & Status"

2. **Multiple Roles**
   - Users can have multiple roles simultaneously
   - E.g., Admin + Teacher
   - All checkboxes are independent

3. **Shadow User Behavior**
   - When checked, email becomes optional
   - Label changes to "Email (Optional)"
   - Placeholder changes to indicate not required
   - Affects form validation

4. **Checkbox Handler**
   - Custom handler converts checkbox change to ChangeEvent
   - Handles `checked` boolean instead of `value`

### Actions

- Handled by parent form
- Likely: Save, Cancel

### Layout

```
<Grid 2-col> (sm:grid-cols-2)
  <First Name>
  <Last Name>
</Grid>

<Grid 2-col> (sm:grid-cols-2)
  <Email> (required if not shadow)
  <Username>
</Grid>

<Roles & Status Section> (space-y-3)
  <Label: "Roles & Status">
  <Grid 2-col in bordered container> (p-4 border rounded-lg bg-muted)
    <Shadow User checkbox>
    <Admin checkbox>
    <Teacher checkbox>
    <Student checkbox>
  </Grid>
</Roles & Status Section>

<Active User checkbox> (standalone)
```

- Top-level spacing provided by parent
- Internal field spacing: `space-y-2`

### Navigation

- Handled by parent form

### Error Handling

1. **Field-level errors**
   - Standard pattern
   - ARIA invalid attributes

2. **Conditional validation**
   - Email validation changes based on shadow user status

### Success State

- Handled by parent form

---

## 10. ProfileForm

### Purpose
Allow users to edit their own profile information.

### User Context
All authenticated users - students, teachers, admins editing their own profile.

### Fields

1. **First Name** (Required)
   - Type: `text`
   - Label: "First Name *"
   - Required indicator: Red asterisk
   - Placeholder: "Enter your first name"
   - Validation:
     - Required
     - Minimum 1 character
     - Maximum 100 characters
   - Error messages:
     - "First name is required"
   - Field spacing: `space-y-2`

2. **Last Name** (Required)
   - Type: `text`
   - Label: "Last Name *"
   - Required indicator: Red asterisk
   - Placeholder: "Enter your last name"
   - Validation:
     - Required
     - Minimum 1 character
     - Maximum 100 characters
   - Error messages:
     - "Last name is required"
   - Field spacing: `space-y-2`

3. **Username**
   - Type: `text`
   - Label: "Username"
   - Placeholder: "Choose a username (optional)"
   - Validation:
     - Optional
     - Minimum 3 characters if provided
     - Maximum 50 characters
   - Error messages:
     - "Username must be at least 3 characters"
   - Field spacing: `space-y-2`

4. **Bio**
   - Type: `textarea` (custom styled)
   - Label: "Bio"
   - Placeholder: "Tell us about yourself (optional)"
   - Max length: 500 characters
   - Validation:
     - Optional
     - Maximum 500 characters
   - Error messages:
     - "Bio must be less than 500 characters"
   - Special features:
     - Character counter: "X/500 characters"
     - Custom textarea styling (not using shadcn Textarea)
   - Field spacing: `space-y-2`

5. **Email** (Display only)
   - Type: `email`
   - Label: "Email"
   - Value: User's email
   - Disabled: `true`
   - Style: `bg-muted`
   - Helper text: "Email cannot be changed here. Contact support to update your email."
   - Field spacing: `space-y-2`

### Special Features

1. **Custom Bio Textarea**
   - Classes: `w-full px-3 py-2 text-sm border rounded-md shadow-xs transition-all duration-200 text-foreground bg-background dark:bg-input/30 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring min-h-24`
   - Conditional error border: `border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40`
   - Normal border: `border-input hover:border-muted-foreground`
   - Min height: `min-h-24` (equivalent to 6 rows)

2. **Character Counter**
   - Shows below bio textarea
   - Text: "{length}/500 characters"
   - Style: `text-xs text-muted-foreground`
   - Updates in real-time

3. **Email Field Lock**
   - Disabled input with muted background
   - Helper text explains why it can't be changed
   - Style: `text-xs sm:text-sm bg-muted`

4. **Field Components**
   - Uses internal `TextField` and `BioField` components
   - Separate `EmailField` component for disabled email

### Actions

- Handled by parent form
- Likely: Save Changes, Cancel

### Layout

```
<First Name> (space-y-2, required)

<Last Name> (space-y-2, required)

<Username> (space-y-2, optional)

<Bio> (space-y-2)
  <Label>
  <Custom Textarea (min-h-24, maxLength 500)>
  <Error if present>
  <Character counter>

<Email> (space-y-2, disabled)
  <Label>
  <Input (disabled, bg-muted)>
  <Helper text>
```

- Fields container: `space-y-4`

### Navigation

- Handled by parent form

### Error Handling

1. **Field-level errors**
   - Display below each field
   - Style: `text-sm text-destructive`
   - ARIA invalid on field

2. **Bio field errors**
   - Custom error styling on textarea
   - Conditional border color

### Success State

- Handled by parent form
- Likely shows success message and updates profile

---

## 11. OnboardingForm (Multi-Step)

### Purpose
Collect user preferences and learning goals during first-time user setup.

### User Context
New users after sign-up, before first dashboard access.

### Multi-Step Structure

**Step 1 of 3: Learning Goals**
**Step 2 of 3: Skill Level**
**Step 3 of 3: Preferences**

### Step 1: Learning Goals

#### Fields

1. **Goals** (Multi-select buttons)
   - Type: Custom button group (multi-select)
   - Label: "What are your guitar learning goals?"
   - Options (5 buttons):
     - `learn-songs` → "🎵 Learn favorite songs"
     - `music-theory` → "📚 Music theory"
     - `performance` → "🎤 Performance skills"
     - `songwriting` → "✍️ Songwriting"
     - `technique` → "🎸 Improve technique"
   - Validation:
     - Must select at least one
   - Error messages:
     - "Please select at least one goal"
   - Default: Empty array
   - Special features:
     - Each button toggles on/off
     - Selected: `border-primary bg-primary/10`
     - Error: `border-destructive`
     - Shows checkmark icon when selected
     - ARIA: `aria-pressed` attribute
   - Layout: `grid grid-cols-1 gap-3`

### Step 2: Skill Level

#### Fields

1. **Skill Level** (Single select buttons)
   - Type: Custom button group (radio behavior)
   - Label: "What's your current skill level?"
   - Options (3 buttons):
     - `beginner` → "Beginner" / "Just starting out"
     - `intermediate` → "Intermediate" / "Know the basics"
     - `advanced` → "Advanced" / "Ready for complex pieces"
   - Validation:
     - Required
   - Error messages:
     - "Please select your skill level"
   - Default: "beginner"
   - Special features:
     - Radio button behavior (single select)
     - Each button shows title + description
     - Selected: `border-primary bg-primary/10`
     - Shows checkmark icon when selected
     - ARIA: `aria-pressed` attribute
   - Layout: `space-y-3`

### Step 3: Preferences

#### Fields

1. **Learning Style** (Multi-select buttons) (Optional)
   - Type: Custom button group (multi-select)
   - Label: "Learning style"
   - Options (4 buttons in 2x2 grid):
     - `video` → "📹 Video tutorials"
     - `sheet-music` → "🎼 Sheet music"
     - `tabs` → "🎵 Tab notation"
     - `all` → "✨ All of the above"
   - Validation:
     - Optional
   - Default: Empty array
   - Special features:
     - Same toggle behavior as goals
     - Grid layout: `grid grid-cols-2 gap-3`
     - Compact vertical layout with icon + label
   - Layout: 2x2 grid

2. **Instrument Preference** (Multi-select buttons) (Optional)
   - Type: Custom button group (multi-select)
   - Label: "Instrument preference (select all that apply)"
   - Options (4 buttons in 2x2 grid):
     - `acoustic` → "🎸 Acoustic"
     - `electric` → "⚡ Electric"
     - `classical` → "🎻 Classical"
     - `bass` → "🎸 Bass Guitar"
   - Validation:
     - Optional
   - Default: Empty array
   - Special features:
     - Same toggle behavior as goals
     - Grid layout: `grid grid-cols-2 gap-3`
     - Shows checkmark when selected
   - Layout: 2x2 grid

### Special Features

1. **Progress Bar**
   - Shows "Step X of 3" and percentage
   - Visual bar: `h-2 bg-muted rounded-full`
   - Fill: `bg-primary transition-all duration-300`
   - Width: `(currentStep / 3) * 100%`
   - Location: Top of form

2. **Welcome Message**
   - Step 1 only
   - Text: "Welcome{, firstName}!" (personalized if available)
   - Style: `text-xl font-semibold`

3. **Button States**
   - Normal: `border-border hover:border-muted-foreground`
   - Selected: `border-primary bg-primary/10`
   - Error: `border-destructive`
   - All: `border-2 transition-all`
   - Padding: `p-4` for steps 1-2, `p-3` for step 3

4. **Icons**
   - Emojis for all options
   - Size: `text-2xl` (step 3 icons)
   - Checkmark SVG for selected state
   - Size: `h-5 w-5` (step 1-2), `h-4 w-4` (step 3)

5. **Step Navigation**
   - Step 1: "Next" button (or "Skip to preferences")
   - Step 2: "Back" + "Next" buttons
   - Step 3: "Back" + "Complete Setup" buttons
   - All navigation is button-based (not automatic)

6. **Skip Link**
   - Step 1 only
   - Text: "Skip to preferences"
   - Action: Jump directly to step 3
   - Style: `text-sm text-muted-foreground hover:text-foreground`
   - Disabled when: Loading

### Actions

1. **Next Button**
   - Steps 1-2 only
   - Type: `button`
   - Style: Default variant, `flex-1`
   - Text: "Next"
   - Action: Validate current step, move to next

2. **Back Button**
   - Steps 2-3 only
   - Type: `button`
   - Variant: `outline`
   - Style: `flex-1`
   - Text: "Back"
   - Disabled when: Loading
   - Action: Move to previous step

3. **Complete Setup Button**
   - Step 3 only
   - Type: `button`
   - Style: Default variant, `flex-1`
   - Text: "Complete Setup"
   - Loading text: "Setting up..."
   - Disabled when: Loading
   - Action: Submit form via `completeOnboarding` server action

4. **Skip Link**
   - Step 1 only
   - See Special Features

5. **Button Container**
   - Layout: `flex gap-3 pt-2`
   - Back and Next/Complete side by side
   - Both buttons `flex-1` (equal width)

### Layout

#### Step 1
```
<Progress Bar>

<Welcome Message>
<Description>

<Goals Fieldset> (grid grid-cols-1 gap-3)
  <Goal Button> x5
</Goals Fieldset>
<Error if present>
```

#### Step 2
```
<Progress Bar>

<Title>
<Description>

<Skill Level Fieldset> (space-y-3)
  <Level Button> x3 (with title + description)
</Skill Level Fieldset>
```

#### Step 3
```
<Progress Bar>

<Title>
<Description>

<Learning Style Fieldset>
  <Label>
  <Grid 2x2> (grid-cols-2 gap-3)
    <Style Button> x4
  </Grid>
</Learning Style Fieldset>

<Instrument Preference Fieldset>
  <Label>
  <Grid 2x2> (grid-cols-2 gap-3)
    <Instrument Button> x4
  </Grid>
</Instrument Preference Fieldset>
```

#### All Steps
```
<Form-level error if present>

<Navigation Buttons> (flex gap-3 pt-2)
  <Back Button (if step > 1)>
  <Next or Complete Button>
</Navigation Buttons>

<Skip Link (step 1 only)>
```

- Container: `mt-8 space-y-6`

### Navigation

- Step 1 → Next → Step 2 (if goals selected)
- Step 1 → Skip → Step 3
- Step 2 → Back → Step 1
- Step 2 → Next → Step 3
- Step 3 → Back → Step 2
- Step 3 → Complete → Onboarding completion, redirect to dashboard

### Error Handling

1. **Field-level errors**
   - Step 1: Shows error below goals if none selected on Next
   - All errors: `text-sm text-destructive`

2. **Form-level errors**
   - Component: `FormAlert` with `type="error"`
   - Shows validation or submission errors

3. **Step validation**
   - Step 1: Prevents Next if no goals selected
   - Final submit: Full schema validation

### Success State

- Calls `completeOnboarding` server action
- Shows success toast: "Profile set up successfully!"
- Redirects to dashboard
- Error state: Shows error message, stays on form

---

## 12. InviteUserModal

### Purpose
Invite a new user to the system by sending them an invitation email.

### User Context
Admin and Teacher - for inviting students or other users.

### Fields

1. **Full Name** (Required)
   - Type: `text`
   - Label: "Full Name"
   - Placeholder: "John Doe"
   - Validation:
     - Required
     - Minimum 1 character
     - Maximum 200 characters
   - Error messages:
     - "Full name is required"
     - "Full name too long"
   - Default value: `initialName` prop or empty string
   - Special: Auto-focused when modal opens
   - Field spacing: `space-y-2`

2. **Email** (Required)
   - Type: `email`
   - Label: "Email"
   - Placeholder: "user@example.com"
   - Validation:
     - Required
     - Valid email format
   - Error messages:
     - "Valid email required"
   - Default value: `initialEmail` prop or empty string
   - Field spacing: `space-y-2`

3. **Phone Number**
   - Type: `tel`
   - Label: "Phone Number (Optional)"
   - Placeholder: "+48 123 456 789"
   - Validation:
     - Optional
     - Regex pattern: `/^(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/`
   - Error messages:
     - "Valid phone number required"
   - Default value: `initialPhone` prop or empty string
   - Field spacing: `space-y-2`

4. **Role** (Required)
   - Type: `select` (shadcn/ui Select)
   - Label: "Role"
   - Placeholder: "Select a role"
   - Default value: "student"
   - Options:
     - `student` → "Student"
     - `teacher` → "Teacher"
     - `admin` → "Admin"
   - Validation:
     - Required
   - Error messages:
     - "Please select a role"
   - Field spacing: `space-y-2`

### Special Features

1. **Modal Dialog**
   - Component: shadcn/ui `Dialog`
   - Max width: `sm:max-w-[425px]`
   - Title: "Invite New User"
   - Controlled open state

2. **Trigger Options**
   - Prop: `trigger?: React.ReactNode`
   - Default trigger: `QuickActionButton` with:
     - Emoji: "✉️"
     - Title: "Invite User"
     - Description: "Send an invitation to a new user"
   - Custom trigger can be provided

3. **Auto-focus**
   - Full name field auto-focuses when modal opens
   - Uses ref and setTimeout(0) for reliable focus

4. **Form Reset on Open**
   - When modal opens:
     - Resets to initial values
     - Clears errors
     - Resets touched state
   - When modal closes:
     - Maintains state (doesn't reset)

5. **Success Behavior**
   - Shows success toast: "User invited successfully!"
   - Closes modal
   - Clears form
   - Resets touched state

6. **Validation Strategy**
   - Validate on blur
   - Clear individual field errors on change
   - Clear form-level error on change
   - Full validation on submit

### Actions

1. **Cancel Button**
   - Type: `button`
   - Variant: `outline`
   - Text: "Cancel"
   - Disabled when: Loading (isPending)
   - Action: Close modal

2. **Submit Button: "Send Invitation"**
   - Type: `submit`
   - Variant: Default
   - Text: "Send Invitation"
   - Loading text: "Inviting..."
   - Disabled when: Loading (isPending)
   - Action: Validate and call `inviteUser` server action

3. **Button Container**
   - Layout: `flex justify-end gap-3 pt-2`
   - Cancel on left, Submit on right

### Layout

```
<Dialog>
  <DialogTrigger>
    {trigger or default QuickActionButton}
  </DialogTrigger>

  <DialogContent (sm:max-w-[425px])>
    <DialogHeader>
      <DialogTitle>Invite New User</DialogTitle>
    </DialogHeader>

    <Form> (space-y-6 py-4)

      <Full Name Field> (space-y-2, required, auto-focus)

      <Email Field> (space-y-2, required)

      <Phone Number Field> (space-y-2, optional)

      <Role Select> (space-y-2, required)

      <Form-level error alert if present>

      <Action Buttons> (flex justify-end gap-3 pt-2)
        <Cancel Button (outline)>
        <Submit Button>
      </Action Buttons>

    </Form>
  </DialogContent>
</Dialog>
```

### Navigation

- Modal-based, no page navigation
- Close modal on success or cancel
- Success toast notification

### Error Handling

1. **Field-level errors**
   - Standard pattern
   - Border changes to `border-destructive`
   - Error text below field
   - ARIA invalid

2. **Form-level errors**
   - Component: `FormAlert` with `type="error"`
   - Shows submission errors

3. **Touched state management**
   - Tracks each field individually
   - Only shows errors for touched fields
   - All fields marked touched on submit

### Success State

- Success toast via `sonner`: "User invited successfully!"
- Modal closes
- Form clears
- Touched state resets
- Parent page likely refreshes to show new user

---

## 13. SettingsForm

### Purpose
Configure user preferences for notifications, appearance, privacy, integrations, and API keys.

### User Context
All authenticated users - personal settings.

### Form Structure

This is a **non-traditional form** - it's a settings page with multiple sections, not a single form submission. Settings are managed via a custom hook (`useSettings`) and saved via a "Save Changes" button.

### Sections

#### 1. Integrations Section

**Google Calendar Integration**
- Not a form field, but an integration status display
- Shows: "Connected" or "Not Connected"
- Action button: "Connect Google Calendar" (if not connected)
- Props: `isGoogleConnected: boolean`

#### 2. Notifications Section

**Title:** "Notifications"
**Description:** "Manage how you receive updates and reminders"

1. **Email Notifications** (Toggle)
   - Type: `checkbox` (rendered as toggle switch)
   - Label: "Email Notifications"
   - Description: "Receive updates and news via email"
   - Default: Varies by user settings
   - Component: `ToggleSetting`

2. **Push Notifications** (Toggle)
   - Type: `checkbox` (rendered as toggle switch)
   - Label: "Push Notifications"
   - Description: "Get real-time notifications in your browser"
   - Component: `ToggleSetting`

3. **Lesson Reminders** (Toggle)
   - Type: `checkbox` (rendered as toggle switch)
   - Label: "Lesson Reminders"
   - Description: "Receive reminders before scheduled lessons"
   - Component: `ToggleSetting`

#### 3. Appearance Section

**Title:** "Appearance"
**Description:** "Customize how the app looks and feels"

1. **Theme** (Select)
   - Type: `select` (shadcn/ui Select)
   - Label: "Theme"
   - Description: "Choose your preferred color scheme"
   - Options:
     - `light` → "Light"
     - `dark` → "Dark"
     - `system` → "System Default"
   - Default: User's saved preference or 'system'
   - Component: `SelectSetting`

2. **Language** (Select)
   - Type: `select` (shadcn/ui Select)
   - Label: "Language"
   - Description: "Select your preferred language"
   - Options:
     - `en` → "English"
     - `pl` → "Polski"
     - `es` → "Español"
     - `de` → "Deutsch"
     - `fr` → "Français"
   - Default: User's saved preference or 'en'
   - Component: `SelectSetting`

#### 4. Privacy Section

**Title:** "Privacy"
**Description:** "Control your privacy and data visibility"

1. **Profile Visibility** (Select)
   - Type: `select` (shadcn/ui Select)
   - Label: "Profile Visibility"
   - Description: "Who can see your profile"
   - Options:
     - `public` → "Public"
     - `contacts` → "Contacts Only"
     - `private` → "Private"
   - Component: `SelectSetting`

2. **Show Email** (Toggle)
   - Type: `checkbox` (rendered as toggle switch)
   - Label: "Show Email"
   - Description: "Display your email on your public profile"
   - Component: `ToggleSetting`

3. **Show Last Seen** (Toggle)
   - Type: `checkbox` (rendered as toggle switch)
   - Label: "Show Last Seen"
   - Description: "Let others see when you were last active"
   - Component: `ToggleSetting`

#### 5. API Keys Section

**Title:** API Keys configuration
- Component: `ApiKeysSection`
- Purpose: Manage API keys for external services
- Specific fields depend on component implementation

#### 6. Bearer Token Section (Conditional)

**Title:** Bearer Token display
- Component: `BearerTokenCard`
- Only shows if `bearerToken` prop is provided
- Purpose: Display user's API bearer token
- Read-only display, not editable

### Special Features

1. **Settings Persistence**
   - Current: localStorage (client-side)
   - TODO: Migrate to Supabase `user_settings` table

2. **Change Detection**
   - Hook tracks if settings have changed
   - Save button only enabled when `hasChanges = true`

3. **Section Separators**
   - Each section separated by: `border-t border-border pt-8`
   - Clean visual hierarchy

4. **Loading States**
   - Initial load: Full-page spinner
   - Save loading: Button shows spinner + "Saving..."

5. **Real-time Updates**
   - Settings update via `updateSetting` callback
   - No need to wait for save to see changes in UI
   - Actual persistence happens on "Save Changes"

6. **Success/Error Alerts**
   - Success: "Settings saved successfully" (auto-hide after 3s)
   - Error: Shows error message (stays visible)

### Actions

1. **Save Changes Button**
   - Type: `button`
   - Variant: Default
   - Text: "Save Changes"
   - Loading state:
     - Spinner icon: `<Spinner size="sm" className="mr-2" />`
     - Text: "Saving..."
   - Disabled when: No changes OR loading
   - ARIA live: `polite`
   - Layout: First in action group

2. **Reset to Defaults Button**
   - Type: `button`
   - Variant: `outline`
   - Text: "Reset to Defaults"
   - Disabled when: Loading
   - Action: Calls `resetSettings()` hook method
   - Layout: Second in action group

3. **Cancel Button**
   - Type: `button`
   - Variant: `outline`
   - Text: "Cancel"
   - Disabled when: Loading
   - Action: `router.back()`
   - Layout: Third in action group

4. **Action Buttons Container**
   - Layout: `flex flex-col sm:flex-row gap-3`
   - Mobile: Stacked, full width
   - Desktop: Horizontal, auto width
   - Each button: `w-full sm:w-auto`

### Layout

```
<Container> (min-h-screen bg-background)
  <Inner Container> (container mx-auto px-4 py-8 max-w-3xl)

    <Settings Header>

    <Error Alert if present>
    <Success Alert if present>

    <Card> (bg-card rounded-lg shadow-sm border p-6 space-y-8)

      <Integrations Section>

      --- border-t separator ---

      <Notifications Section>
        <Toggle Setting> x3

      --- border-t separator ---

      <Appearance Section>
        <Select Setting> x2

      --- border-t separator ---

      <Privacy Section>
        <Select Setting> x1
        <Toggle Setting> x2

      --- border-t separator ---

      <API Keys Section>

      --- border-t separator (if bearerToken) ---

      <Bearer Token Card (conditional)>

      --- border-t separator ---

      <Action Buttons> (flex flex-col sm:flex-row gap-3)
        <Save Changes>
        <Reset to Defaults>
        <Cancel>
      </Action Buttons>

    </Card>

  </Inner Container>
</Container>
```

### Navigation

- Cancel: `router.back()`
- No automatic navigation on save
- User stays on settings page

### Error Handling

1. **Save Errors**
   - Component: `SettingsAlert` with `type="error"`
   - Displays error message from catch block
   - Stays visible until next action

2. **No Field-level Validation**
   - Settings use predefined options (selects/toggles)
   - No free-form input that needs validation

### Success State

- Component: `SettingsAlert` with `type="success"`
- Message: "Settings saved successfully"
- Auto-hide after 3 seconds
- Settings persist to storage (currently localStorage)

---

## Common Patterns Across All Forms

### Validation Strategy
- **Timing**: Validate on blur, not on every keystroke
- **Clearing**: Clear errors when user starts typing
- **Touched State**: Track which fields have been touched/blurred
- **Error Display**: Only show errors for touched fields
- **Submit**: Validate all fields, mark all as touched

### Field Error Display
```tsx
{error && (
  <p className="text-sm text-destructive" role="alert">
    {error}
  </p>
)}
```

### Field Container
```tsx
<div className="space-y-2">
  <Label htmlFor={id}>{label}</Label>
  <Input
    id={id}
    name={id}
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    aria-invalid={!!error}
    className={error ? 'border-destructive' : ''}
  />
  {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
</div>
```

### Form-level Alerts
- Success: `<FormAlert type="success" message={...} />`
- Error: `<FormAlert type="error" message={...} />`
- Custom styling for specific forms (e.g., SignUpForm email verification)

### Button States
- Normal: `<Button type="submit">Save</Button>`
- Loading: `<Button disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>`
- Disabled: `disabled={!hasChanges || loading}`

### Layout Patterns
- Form container: `space-y-6`
- Field container: `space-y-2`
- Grid layouts: `grid grid-cols-1 sm:grid-cols-2 gap-4`
- Button groups: `flex justify-end gap-3` or `flex gap-3 pt-2`

### Accessibility
- Labels with `htmlFor` matching input `id`
- Error messages with `role="alert"`
- Inputs with `aria-invalid` when errors present
- Required fields marked visually with `*` and semantically with `required` attribute

### Responsive Design
- Mobile-first approach
- Grid columns: `grid-cols-1 sm:grid-cols-2`
- Button layouts: `flex-col sm:flex-row`
- Consistent breakpoint: `sm` (640px)

### Dark Mode Support
- All forms use Tailwind CSS with `dark:` variants
- Color tokens: `bg-background`, `text-foreground`, `border-border`, etc.
- Consistent with design system

---

## Form List Summary

1. **SignInForm** - Email/password + Google OAuth authentication
2. **SignUpForm** - User registration with password strength indicator
3. **ForgotPasswordForm** - Send password reset email
4. **ResetPasswordForm** - Set new password from reset link
5. **LessonForm** - Create/edit lessons with AI notes generation
6. **AssignmentForm** - Create/edit assignments with AI description generation
7. **AssignmentTemplateForm** - Create/edit reusable assignment templates
8. **SongForm** - Comprehensive song metadata with Spotify integration
9. **UserForm** - Admin user management with roles
10. **ProfileForm** - User profile editing (self-service)
11. **OnboardingForm** - Multi-step new user onboarding (3 steps)
12. **InviteUserModal** - Invite users via modal dialog
13. **SettingsForm** - Multi-section settings page (not traditional form)

---

## Implementation Notes for AI UI Builder

### Component Library
- Use shadcn/ui components: `Input`, `Button`, `Label`, `Select`, `Textarea`, `Checkbox`, `Dialog`, `Alert`
- Import from `@/components/ui/*`

### Icon Library
- Lucide React: `Eye`, `EyeOff`, `AlertCircle`, `CheckCircle2`, `Mail`, `Spinner`
- Import from `lucide-react`

### Styling
- Tailwind CSS 4
- Use design tokens: `bg-background`, `text-foreground`, `border-border`, `text-destructive`, `text-success`, `text-muted-foreground`, `bg-card`, `bg-muted`
- Always include `dark:` variants where appropriate

### Form State Management
- Use React `useState` for form values
- Separate state for: values, errors, touched, loading, success
- Custom hooks for complex forms (e.g., `useSignUpLogic`, `useTemplateForm`)

### Validation
- Zod schemas from `@/schemas/*`
- Use `safeParse` for validation
- Extract errors from `result.error.issues`

### Server Actions
- Import from `@/app/actions/*` or `@/app/[path]/actions`
- Examples: `resetPassword`, `completeOnboarding`, `inviteUser`, `createAssignmentTemplate`

### File Structure
- Forms in `components/[domain]/[FormName].tsx`
- Schemas in `schemas/[Schema]Schema.ts`
- Server actions in `app/actions/*` or `app/[route]/actions.ts`

### Testing IDs
- Include `data-testid` attributes for important fields and buttons
- Pattern: `data-testid="field-name"` or `data-testid="action-button"`

---

*End of Forms Specification Document*
