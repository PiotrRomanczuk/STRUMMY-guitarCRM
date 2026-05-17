# Teacher Journeys: Google Calendar

> Journeys #5-7 | Role: Teacher | Priority: P0 (OAuth), P1 (Import, Webhook)

---

## Design Decisions

Decisions captured from planning review — these apply across all three journeys.

| Area | Decision | Detail |
|------|----------|--------|
| **Event filtering** | Calendly markers | Events created via Calendly have specific metadata (event type URL, custom fields) that auto-identify them as guitar lessons. No keyword matching or manual tagging required. |
| **OAuth scopes** | `calendar` (full read/write) | Full read/write access to the user's primary calendar. Required for event CRUD and webhook `watch()`. |
| **Calendar selection** | Primary only | Only sync the user's primary Google Calendar. |
| **Time window** | Past + future | Calendar page shows both past 14 days and upcoming 14 days (28-day window). |
| **Import range** | No limit | Teachers can import any date range. Streaming SSE handles large imports. |
| **Student matching** | Strict email match | Match attendees to students by exact email only. If a match exists, auto-link. If no match, create a shadow student (minimal profile: email + name from calendar). |
| **Tab close mid-import** | Server continues | Import runs to completion server-side regardless of client connection. |
| **Re-import conflicts** | Flag conflict | If a previously imported event was manually edited in Strummy, re-import flags a conflict and lets the teacher choose which version to keep. |
| **Partial import** | Keep partial | Cancelled imports keep all lessons created so far. Teacher can re-run for remaining months. |
| **Timezone** | Store as UTC | All event times converted to UTC in the database. Displayed in the teacher's local timezone. |
| **Rate limits** | Exponential backoff | Detect Google API 429 responses and retry with exponential backoff automatically. |
| **Webhook operations** | Full CRUD | Handle create, update, and delete notifications from Google. |
| **Event deletion** | Soft delete / archive | When a Google event is deleted, mark the corresponding Strummy lesson as `cancelled` but keep it in the database. |
| **Webhook auth** | Channel ID + token | Validate `X-Goog-Channel-ID` and `X-Goog-Channel-Token` headers against stored subscription data. Reject unrecognized requests. |
| **Test budget** | 3 features | Each journey is a separate feature — up to 10 E2E tests each. |
| **Multi-teacher isolation** | Integration test | Verify via RLS policy testing at the integration layer, not E2E. |
| **Account deletion** | Not implemented | Account deletion is not yet supported — skip cleanup cascade for now. |
| **CI approach** | Dedicated test account | A real Google test account with credentials stored as CI secrets. E2E tests run the full OAuth flow against real Google. |
| **Webhook wait strategy** | Poll with timeout | Poll lessons page/DB every 2s for up to 30s until the expected lesson appears. |

### Prerequisites (TBD)

- [ ] Verify `user_integrations` table exists in Supabase schema (or design + migrate)
- [ ] Verify `webhook_subscriptions` table exists (or design + migrate)
- [ ] Set up dedicated Google test account and store credentials in CI secrets
- [ ] Ensure `/dashboard/calendar` stub is routable and renders

---

## Journey 5: Google Calendar — OAuth Connection

**Priority**: P0
**Role**: Teacher (or Admin)
**Pages**: `/dashboard/calendar`, `/api/auth/google`, Google OAuth consent screen
**Existing coverage**: None
**E2E test budget**: Up to 10 tests (separate feature)

### Preconditions
- Logged in as teacher
- Google Calendar NOT yet connected (no `user_integrations` row for this user)
- Dedicated test Google account with Calendly-created lesson events on the primary calendar

### Happy Path

#### Step 1 — Navigate to Calendar page (disconnected state)
1. Click "Calendar" in sidebar
2. **Expect**: `/dashboard/calendar` loads
3. **Expect**: A "Connect Google Calendar" button/prompt is displayed
4. **Expect**: No calendar events shown (empty state message)

#### Step 2 — Initiate OAuth flow
1. Click "Connect Google Calendar"
2. **Expect**: Browser redirects to Google OAuth consent screen
3. **Expect**: Requested scopes include `calendar.events` (read/write) and email
4. Select the dedicated test Google account
5. Click "Allow" / "Grant access"
6. **Expect**: Browser redirects back to the app (callback URL)
7. **Expect**: Redirect to `/dashboard/calendar`

#### Step 3 — Verify connected state
1. On `/dashboard/calendar`
2. **Expect**: "Connect" button is replaced with connected indicator (e.g., green badge, "Connected to user@gmail.com")
3. **Expect**: Calendar events from the primary Google Calendar are displayed
4. **Expect**: Only Calendly-created events are shown (filtered by Calendly metadata markers)
5. **Expect**: Non-Calendly events are filtered OUT
6. **Expect**: Each event shows: title, date/time, attendee(s)

#### Step 4 — View calendar events (past + future)
1. Scroll through displayed events
2. **Expect**: Events from the past 14 days AND upcoming 14 days are shown
3. **Expect**: Date/time displayed in user's local timezone (times stored as UTC internally)

### Edge Cases

#### E1 — User denies OAuth consent
1. Click "Connect Google Calendar"
2. On Google consent screen, click "Cancel" / "Deny"
3. **Expect**: Redirect back to app with error
4. **Expect**: Error message displayed ("Google Calendar connection was cancelled")
5. **Expect**: Calendar page still shows disconnected state

#### E2 — Token expiry and refresh
1. After connecting, simulate token expiry (set `expires_at` to past timestamp in `user_integrations`)
2. Navigate to Calendar page
3. **Expect**: Token refreshes automatically via refresh token in the background
4. **Expect**: Calendar events still load without re-prompting OAuth

#### E3 — Disconnect and reconnect
1. Click "Disconnect" option
2. **Expect**: `user_integrations` row removed, back to disconnected state
3. Connect again via OAuth
4. **Expect**: Events reload successfully with fresh tokens

### Cleanup
- Remove `user_integrations` row for the test user

---

## Journey 6: Google Calendar — Historical Import

**Priority**: P1
**Role**: Teacher (with Google Calendar connected)
**Pages**: `/dashboard/lessons/import`
**Existing coverage**: None
**E2E test budget**: Up to 10 tests (separate feature)

### Preconditions
- Logged in as teacher
- Google Calendar connected (OAuth tokens stored in `user_integrations`)
- Test Google Calendar has Calendly-created lesson events spanning several months
- Some event attendees match existing Strummy student emails; others do not

### Happy Path

#### Step 1 — Navigate to lesson import page
1. Navigate to `/dashboard/lessons/import`
2. **Expect**: Page loads with import controls
3. **Expect**: Date range selector (no max limit)
4. **Expect**: "Import" button
5. **Expect**: Option to control webhook (start/stop live sync)

#### Step 2 — Start historical import
1. Select a date range (e.g., last 3 months)
2. Click "Import"
3. **Expect**: SSE streaming progress begins
4. **Expect**: Progress indicator shows: "Processing month 1 of 3..." or similar
5. **Expect**: Running count of events found, lessons created, students matched, shadows created

#### Step 3 — Monitor streaming progress
1. Watch the streaming output
2. **Expect**: Each month processes sequentially
3. **Expect**: For each event: shows event title, date, attendee email, action taken:
   - `created` — new lesson with matched student
   - `shadow_created` — new lesson + new shadow student (email + name from calendar, no match found)
   - `skipped` — not a Calendly event (filtered out)
4. **Expect**: Events without attendees are imported without a student link (lesson exists but unassigned)

#### Step 4 — Verify imported lessons
1. After import completes, navigate to `/dashboard/lessons`
2. **Expect**: Newly imported lessons appear in the list
3. **Expect**: Each lesson has `google_event_id` set
4. Click on an imported lesson
5. **Expect**: Student is correctly linked (existing student matched by email, or shadow student)
6. **Expect**: Scheduled date/time matches the Google Calendar event (stored UTC, displayed local TZ)

#### Step 5 — Re-import same range (deduplication)
1. Go back to `/dashboard/lessons/import`
2. Import the same date range again
3. **Expect**: Previously imported events are SKIPPED (dedup by `google_event_id`)
4. **Expect**: Count shows "0 new lessons created"

#### Step 6 — Re-import with local edits (conflict detection)
1. Manually edit an imported lesson in Strummy (e.g., change the notes or time)
2. Go to `/dashboard/lessons/import` and re-import the same range
3. **Expect**: Conflict flagged for the edited lesson
4. **Expect**: UI shows both versions (Google vs. local) and lets teacher choose
5. **Expect**: Unedited lessons are still skipped normally

### Edge Cases

#### E1 — Cancel mid-import
1. Start a large import (6+ months)
2. While streaming is in progress, click "Cancel" button
3. **Expect**: SSE stream stops on the client
4. **Expect**: Server continues processing to completion in the background
5. **Expect**: Lessons imported so far are KEPT (not rolled back)
6. **Expect**: UI shows partial completion message with count of what was imported

#### E2 — Event with no attendees
1. Have a Google Calendar Calendly event with no attendees
2. Run import
3. **Expect**: Event is imported as a lesson with no student linked
4. **Expect**: Streaming output shows action as `created (no attendee)`

#### E3 — Event attendee matches existing student (strict email)
1. Have a calendar event with attendee `student@example.com` matching a known Strummy student
2. Run import
3. **Expect**: Lesson is linked to the existing student profile (no shadow created)
4. **Expect**: Streaming output shows action as `created (matched: Student Name)`

#### E4 — Google API rate limit during import
1. Import a very large range that triggers Google's rate limit (429 response)
2. **Expect**: Import pauses and retries with exponential backoff automatically
3. **Expect**: Streaming output shows "Rate limited, retrying in Xs..."
4. **Expect**: Import resumes and completes successfully

#### E5 — Browser tab closed mid-import
1. Start an import, then close the browser tab
2. Re-open `/dashboard/lessons/import`
3. **Expect**: Server-side import continued to completion
4. **Expect**: Page shows results of the completed import (or "import in progress" if still running)

### Cleanup
- Delete imported lessons matching `google_event_id` pattern
- Delete shadow students created during import

---

## Journey 7: Google Calendar — Webhook Sync

**Priority**: P1
**Role**: Teacher (with Google Calendar connected)
**Pages**: `/dashboard/lessons/import` (webhook controls), `/api/webhooks/google-calendar`
**Existing coverage**: None
**E2E test budget**: Up to 10 tests (separate feature)

### Preconditions
- Logged in as teacher with Google Calendar connected
- Webhook NOT yet set up
- Google Calendar API credentials available in CI for programmatic event creation

### Technical Notes
- **Webhook authentication**: Endpoint validates `X-Goog-Channel-ID` and `X-Goog-Channel-Token` headers against stored `webhook_subscriptions` data. Requests with invalid/missing tokens are rejected with 401.
- **Event creation in tests**: Use Google Calendar API (service account or OAuth credentials) to programmatically create/update/delete events. Do NOT use the Google Calendar UI in E2E tests.
- **Wait strategy**: Poll the lessons list (or DB directly) every 2s for up to 30s until the expected change appears. Do NOT use fixed waits.

### Happy Path

#### Step 1 — Set up webhook
1. Navigate to `/dashboard/lessons/import`
2. Click "Enable Live Sync"
3. **Expect**: Success message "Webhook registered"
4. **Expect**: Webhook status indicator shows "Active"
5. **Expect**: `webhook_subscriptions` row created in DB with valid `channel_id`, `token`, and `expiration`

#### Step 2 — Create event via Google Calendar API
1. Programmatically create a new Calendly-style event on the test account's primary calendar
2. Add an attendee email that matches an existing Strummy student
3. Poll lessons list every 2s (max 30s timeout)

#### Step 3 — Verify auto-sync (CREATE)
1. **Expect**: New lesson appears in `/dashboard/lessons` within the polling window
2. **Expect**: Student is correctly linked (strict email match)
3. **Expect**: Date/time matches the Google Calendar event (stored UTC)
4. **Expect**: Lesson has `google_event_id` set

#### Step 4 — Update event via Google Calendar API (UPDATE)
1. Programmatically change the event time via Google Calendar API
2. Poll lessons list every 2s (max 30s timeout)
3. **Expect**: Existing lesson in Strummy updates to reflect the new time
4. **Expect**: `google_event_id` remains the same (no duplicate lesson created)

#### Step 5 — Delete event via Google Calendar API (DELETE)
1. Programmatically delete the event via Google Calendar API
2. Poll lessons list every 2s (max 30s timeout)
3. **Expect**: Lesson in Strummy is soft-deleted / marked as `cancelled`
4. **Expect**: Lesson no longer appears in the active lessons list
5. **Expect**: Lesson is still visible in an "archived" or "cancelled" filter if available

#### Step 6 — Stop webhook
1. Navigate to webhook controls
2. Click "Stop Live Sync"
3. **Expect**: Webhook status shows "Inactive"
4. **Expect**: `webhook_subscriptions` row removed or marked inactive in DB

#### Step 7 — Verify sync stops after webhook disabled
1. Programmatically create another event via Google Calendar API
2. Wait 10s
3. **Expect**: No new lesson appears in Strummy (webhook is inactive)

### Edge Cases

#### E1 — Webhook expiration and auto-renewal
1. Webhook is active but approaching expiration (Google max: 7 days)
2. **Expect**: Cron job `renew-webhooks` automatically renews before expiry
3. Verify via DB that `webhook_subscriptions.expiration` was extended
4. **Expect**: Sync continues working after renewal without teacher intervention

#### E2 — Duplicate webhook prevention
1. Click "Enable Live Sync" when a webhook is already active
2. **Expect**: "Already active" message displayed (no-op)
3. **Expect**: No duplicate `webhook_subscriptions` row created

#### E3 — Spoofed webhook request (security)
1. Send a POST to `/api/webhooks/google-calendar` with invalid `X-Goog-Channel-Token`
2. **Expect**: Endpoint responds with 401 Unauthorized
3. **Expect**: No lesson created or modified

#### E4 — Webhook for event with unknown attendee
1. Create an event with an attendee email that does NOT match any Strummy student
2. Poll lessons list every 2s (max 30s timeout)
3. **Expect**: Lesson created with a shadow student (email + name from event)
4. **Expect**: Shadow student is auto-merged if a matching student is later created

### Cleanup
- Stop webhook via UI or delete `webhook_subscriptions` row
- Delete test lessons created by webhook sync
- Delete test events from Google Calendar via API

---

## Testing Strategy Summary

### Layer Distribution

| Test Type | What to Cover | Count Target |
|-----------|--------------|-------------|
| **E2E (Playwright)** | Happy paths + critical edge cases per journey | Up to 10 per journey |
| **Integration (Jest)** | Multi-teacher RLS isolation, student matching logic, dedup logic, conflict detection | As needed |
| **Unit (Jest)** | Calendly marker parsing, timezone conversion, exponential backoff, webhook token validation | As needed |

### CI Requirements

| Requirement | Detail |
|-------------|--------|
| Google test account | Dedicated account with Calendly events, credentials in CI secrets |
| Google Calendar API access | Service account or OAuth for programmatic event CRUD in webhook tests |
| Environment variables | `GOOGLE_TEST_EMAIL`, `GOOGLE_TEST_PASSWORD`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` |
| Isolation | Each test run cleans up created lessons, shadow students, integrations, and webhooks |

### Multi-Teacher Isolation (Integration Test)

Tested at the integration layer, not E2E:
- Create two teacher accounts with separate Google Calendar connections
- Import lessons for both teachers
- Verify via RLS that Teacher A cannot query Teacher B's lessons, integrations, or webhook subscriptions

---

## Integration Test Implementation Status

**26 integration tests implemented** across 3 files, covering all 3 journeys.

### Files

| File | Journey | Tests | LOC |
|------|---------|-------|-----|
| `__tests__/lib/google-calendar-oauth.integration.test.ts` | 5 (OAuth) | 6 | 130 |
| `__tests__/lib/google-calendar-import.integration.test.ts` | 6 (Import) | 12 | 161 |
| `__tests__/lib/google-calendar-webhook.integration.test.ts` | 7 (Webhook) | 8 | 155 |

### Gap Coverage

| Gap | Description | Status | Test |
|-----|-------------|--------|------|
| Gap 1 | `timeMin`/`timeMax` passed to Google Calendar API | Covered | OAuth: `getCalendarEventsInRange` |
| Gap 4 | 401 for invalid webhook token | Covered | Webhook: invalid token test |
| Gap 6 | `detectConflict` + `resolveConflict` | Covered | Import: conflict detection/resolution (5 tests) |
| Gap 7 | Full `calendar` scope (not `calendar.readonly`) | Covered | OAuth: auth URL scope test |

### Run Commands

```bash
npm run test:integration -- --testPathPatterns="google-calendar"   # Just calendar tests
npm run test:integration                                            # All integration tests
```
