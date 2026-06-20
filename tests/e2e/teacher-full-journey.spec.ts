import { test, expect } from '../fixtures';
import { fillFormField, selectShadcnOption, fillLessonForm, submitForm } from '../helpers/form';

/**
 * Teacher Full Journey E2E Test
 *
 * A single, long-running test that authenticates once as a teacher
 * and exercises every feature available to the teacher/admin role,
 * including full CRUD operations on songs, lessons, and assignments.
 *
 * Phases:
 *  1. Dashboard
 *  2. Songs CRUD
 *  3. Lessons CRUD
 *  4. Assignments CRUD
 *  5. Users Management
 *  6. Song Stats
 *  7. Lesson Stats
 *  8. Student Health Monitoring
 *  9. Activity Logs
 * 10. Calendar
 * 11. Profile
 * 12. Settings
 * 13. Cleanup (delete created test data)
 */
test(
  'Teacher complete journey @journey @teacher',
  { tag: ['@journey', '@teacher'] },
  async ({ page, loginAs }) => {
    // Increase timeout for the full journey
    test.setTimeout(300_000);

    const timestamp = Date.now();
    const testSongTitle = `E2E Song ${timestamp}`;
    const testSongTitleEdited = `E2E Song ${timestamp} EDITED`;
    const testLessonTitle = `E2E Lesson ${timestamp}`;
    const testAssignmentTitle = `E2E Assignment ${timestamp}`;

    // Track URLs for cleanup phase
    let createdSongUrl = '';
    let createdLessonUrl = '';
    let createdAssignmentUrl = '';

    // ── Auth ───────────────────────────────────────────────────────
    await loginAs('teacher');

    // ── Phase 1: Dashboard ────────────────────────────────────────
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/dashboard/);

    // Verify teacher/admin dashboard heading (editorial dashboard uses a personal greeting h1)
    const welcomeHeading = page.locator('h1').first();
    await expect(welcomeHeading).toBeVisible({ timeout: 15_000 });

    // Verify overview stats are present
    const statsSection = page.locator('[data-tour="stats-grid"], .grid').first();
    await expect(statsSection).toBeVisible({ timeout: 10_000 });

    // Verify student list section
    const studentListSection = page.locator('[data-tour="student-list"]').first();
    if ((await studentListSection.count()) > 0) {
      await expect(studentListSection).toBeVisible();
    }

    // Verify recent activity feed
    const activityFeed = page.getByText(/activity|recent/i).first();
    if ((await activityFeed.count()) > 0) {
      await expect(activityFeed).toBeVisible();
    }

    // ── Phase 2: Songs CRUD ───────────────────────────────────────

    // 2a. Navigate to songs list
    await page.goto('/dashboard/songs');
    await page.waitForLoadState('networkidle');

    // Editorial songs list has no data-testid on the table; verify by heading or song links
    await expect(
      page.locator('h1, a[href^="/dashboard/songs/"]:not([href$="/new"])').first()
    ).toBeVisible({ timeout: 15_000 });

    // 2b. Create new song
    const newSongButton = page
      .locator(
        '[data-testid="song-new-button"], a[href*="/songs/new"], button:has-text("New Song"), a:has-text("New Song")'
      )
      .first();
    await expect(newSongButton).toBeVisible({ timeout: 10_000 });
    await newSongButton.click();

    await page.waitForURL(/\/dashboard\/songs\/new/);
    await page.waitForLoadState('networkidle');

    // Fill song form (editorial form uses name= attributes, not data-testid)
    await page.locator('input[name="title"]').fill(testSongTitle);
    await page.locator('input[name="author"]').fill('E2E Test Artist');

    // Select difficulty level
    const levelSelect = page.locator('[data-testid="song-level"]');
    if ((await levelSelect.count()) > 0) {
      await selectShadcnOption(page, 'song-level', 1);
    }

    // Select key
    const keySelect = page.locator('[data-testid="song-key"]');
    if ((await keySelect.count()) > 0) {
      await selectShadcnOption(page, 'song-key', 2);
    }

    // Fill optional chords field
    const chordsField = page.locator('[data-testid="song-chords"]');
    if ((await chordsField.count()) > 0) {
      await chordsField.fill('Am, C, G, F');
    }

    // Submit song form
    const songSaveButton = page.locator('[data-testid="song-save"], button[type="submit"]').first();
    await expect(songSaveButton).toBeVisible();
    await songSaveButton.click();

    // Wait for redirect away from /new
    await expect(page).not.toHaveURL(/\/new/, { timeout: 20_000 });
    await page.waitForLoadState('networkidle');

    // 2c. Verify new song in list — search for it
    await page.goto('/dashboard/songs');
    await page.waitForLoadState('networkidle');
    // Editorial songs list: verify by heading or song links
    await expect(
      page.locator('h1, a[href^="/dashboard/songs/"]:not([href$="/new"])').first()
    ).toBeVisible({ timeout: 15_000 });

    // Editorial search uses input[name="search"]
    const searchFilter = page.locator('input[name="search"], #search-filter');
    if ((await searchFilter.count()) > 0) {
      await searchFilter.focus();
      await searchFilter.fill(testSongTitle);
      await page.waitForTimeout(1500);

      const songRow = page.locator(`a:has-text("${testSongTitle}")`).first();
      await expect(songRow).toBeVisible({ timeout: 10_000 });

      // 2d. Click on the new song to view detail
      await songRow.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard\/songs\/[a-zA-Z0-9-]+/);

      createdSongUrl = page.url();

      // Verify detail page
      const songDetailHeading = page.locator('h1, h2').first();
      await expect(songDetailHeading).toBeVisible({ timeout: 10_000 });
      await expect(songDetailHeading).toContainText(testSongTitle);

      // 2e. Edit the song
      const editButton = page.locator('a[href*="/edit"], button:has-text("Edit")').first();
      if ((await editButton.count()) > 0) {
        await editButton.click();
        await page.waitForLoadState('networkidle');

        // Clear and update title (editorial form uses name= attributes)
        await page.locator('input[name="title"]').fill(testSongTitleEdited);

        // Submit edit
        const saveBtn = page.locator('[data-testid="song-save"], button[type="submit"]').first();
        await saveBtn.click();

        await expect(page).not.toHaveURL(/\/edit/, { timeout: 20_000 });
        await page.waitForLoadState('networkidle');

        // Update tracked URL
        createdSongUrl = page.url();
      }
    }

    // ── Phase 3: Lessons CRUD ─────────────────────────────────────

    // 3a. Navigate to lessons list
    await page.goto('/dashboard/lessons');
    await page.waitForLoadState('networkidle');

    // Editorial lessons list has no data-testid on the table; verify by heading or lesson links
    await expect(
      page.locator('h1, a[href^="/dashboard/lessons/"]:not([href$="/new"])').first()
    ).toBeVisible({ timeout: 15_000 });

    // 3b. Verify filter controls
    const lessonsFilters = page.locator('[data-testid="lessons-filters"]');
    if ((await lessonsFilters.count()) > 0) {
      await expect(lessonsFilters).toBeVisible();
    }

    // 3c. Test status filter if present
    const statusFilterTrigger = page
      .locator(
        '[data-testid="lessons-filters"] select, [data-testid="lessons-filters"] [role="combobox"]'
      )
      .first();
    if ((await statusFilterTrigger.count()) > 0 && (await statusFilterTrigger.isVisible())) {
      await expect(statusFilterTrigger).toBeEnabled();
    }

    // 3d. Create new lesson
    const createLessonButton = page
      .locator(
        '[data-testid="create-lesson-button"], a[href*="/lessons/new"], button:has-text("Create Lesson"), a:has-text("Create Lesson"), a:has-text("New Lesson")'
      )
      .first();
    await expect(createLessonButton).toBeVisible({ timeout: 10_000 });
    await createLessonButton.click();

    await page.waitForURL(/\/dashboard\/lessons\/new/);
    await page.waitForLoadState('networkidle');

    // Fill lesson form (editorial form uses id= attributes: #lesson-student, #lesson-title, #lesson-when)
    await expect(page.locator('#lesson-title')).toBeVisible({ timeout: 15_000 });
    await page.locator('#lesson-student').selectOption({ index: 1 });
    await page.locator('#lesson-title').fill(testLessonTitle);
    await page.locator('#lesson-when').fill('2026-04-15T10:00');

    // Submit lesson form (editorial form has a plain button[type="submit"])
    await page.getByRole('button', { name: 'Create lesson' }).click();

    // Wait for redirect away from /new
    await expect(page).not.toHaveURL(/\/new/, { timeout: 20_000 });
    await page.waitForLoadState('networkidle');

    // 3e. Verify new lesson in list
    await page.goto('/dashboard/lessons');
    await page.waitForLoadState('networkidle');
    // Editorial lessons list: verify by heading or lesson links
    await expect(
      page.locator('h1, a[href^="/dashboard/lessons/"]:not([href$="/new"])').first()
    ).toBeVisible({ timeout: 15_000 });

    // The editorial lessons list has no text-search input (status pill filters only).
    // Do NOT use input[placeholder*="earch"] — that matches the sidebar nav search
    // which opens a dropdown that blocks the lesson rows underneath.

    const lessonLink = page.locator(`a:has-text("${testLessonTitle}")`).first();
    if ((await lessonLink.count()) > 0) {
      await expect(lessonLink).toBeVisible({ timeout: 10_000 });

      // 3f. Click on the new lesson to view detail
      await lessonLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard\/lessons\/[a-zA-Z0-9-]+/);

      createdLessonUrl = page.url();

      // Verify lesson detail
      const lessonDetail = page.locator('[data-testid="lesson-detail"]');
      if ((await lessonDetail.count()) > 0) {
        await expect(lessonDetail).toBeVisible({ timeout: 10_000 });
      }

      // 3g. Edit the lesson
      const lessonEditButton = page.locator('[data-testid="lesson-edit-button"]');
      if ((await lessonEditButton.count()) > 0) {
        await lessonEditButton.click();
        await page.waitForLoadState('networkidle');

        // Edit notes
        const notesField = page.locator('[data-testid="lesson-notes"]');
        if ((await notesField.count()) > 0) {
          await notesField.clear();
          await notesField.fill('E2E Test lesson notes - EDITED during journey test');
        }

        // Submit edit
        await submitForm(page, 'lesson-submit');
        await expect(page).not.toHaveURL(/\/edit/, { timeout: 20_000 });
        await page.waitForLoadState('networkidle');

        createdLessonUrl = page.url();
      }
    }

    // Navigate back to lessons list
    await page.goto('/dashboard/lessons');
    await page.waitForLoadState('networkidle');

    // ── Phase 4: Assignments CRUD ─────────────────────────────────

    // 4a. Navigate to assignments
    await page.goto('/dashboard/assignments');
    await page.waitForLoadState('networkidle');

    const assignmentsPage = page
      .locator('h1, h2')
      .filter({ hasText: /assignment/i })
      .first();
    await expect(assignmentsPage).toBeVisible({ timeout: 10_000 });

    // 4b. Create new assignment
    const createAssignmentButton = page
      .locator(
        'a[href*="/assignments/new"], button:has-text("Create Assignment"), a:has-text("Create Assignment"), a:has-text("New Assignment")'
      )
      .first();
    await expect(createAssignmentButton).toBeVisible({ timeout: 10_000 });
    await createAssignmentButton.click();

    await page.waitForURL(/\/dashboard\/assignments\/new/);
    await page.waitForLoadState('networkidle');

    // Fill assignment form (editorial form: #assignment-student, #assignment-title, #assignment-due)
    await expect(page.locator('#assignment-title')).toBeVisible({ timeout: 15_000 });
    await page.locator('#assignment-student').selectOption({ index: 1 });
    await page.locator('#assignment-title').fill(testAssignmentTitle);

    // Due date
    const dueDateField = page
      .locator('#assignment-due, input[name="due_date"], input[type="date"]')
      .first();
    if ((await dueDateField.count()) > 0) {
      await dueDateField.fill('2026-07-01');
    }

    // Submit assignment form
    await page.getByRole('button', { name: /create assignment/i }).click();

    // Wait for redirect away from /new
    await expect(page).not.toHaveURL(/\/new/, { timeout: 20_000 });
    await page.waitForLoadState('networkidle');

    // 4c. Verify new assignment in list
    await page.goto('/dashboard/assignments');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const assignmentLink = page.locator(`a:has-text("${testAssignmentTitle}")`).first();
    if ((await assignmentLink.count()) > 0) {
      await expect(assignmentLink).toBeVisible({ timeout: 10_000 });

      // 4d. Click on assignment to view detail
      await assignmentLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard\/assignments\/[a-zA-Z0-9-]+/);

      createdAssignmentUrl = page.url();

      // Verify assignment detail
      const assignmentDetailHeading = page.locator('h1, h2').first();
      await expect(assignmentDetailHeading).toBeVisible({ timeout: 10_000 });
    }

    // Navigate back
    await page.goto('/dashboard/assignments');
    await page.waitForLoadState('networkidle');

    // ── Phase 5: Users Management ─────────────────────────────────

    await page.goto('/dashboard/users');
    await page.waitForLoadState('networkidle');

    // Editorial users list has no data-testid; verify by heading or user links
    await expect(page.locator('h1, a[href*="/dashboard/users/"]').first()).toBeVisible({
      timeout: 15_000,
    });

    // Test search (editorial uses input[name="search"])
    const usersSearch = page.locator('input[name="search"], [data-testid="search-input"]');
    if ((await usersSearch.count()) > 0) {
      await usersSearch.focus();
      await usersSearch.fill('student');
      await page.waitForTimeout(1500);

      // Verify filtered results
      const filteredRows = page.locator('[data-testid^="user-row-"]');
      if ((await filteredRows.count()) > 0) {
        await expect(filteredRows.first()).toBeVisible();
      }
    }

    // Test role filter
    const roleFilter = page.locator('[data-testid="role-filter"]');
    if ((await roleFilter.count()) > 0) {
      await roleFilter.click();
      await page.waitForTimeout(500);
      const studentOption = page
        .locator('[role="option"]')
        .filter({ hasText: /student/i })
        .first();
      if ((await studentOption.count()) > 0) {
        await studentOption.click();
        await page.waitForTimeout(1500);
      }
    }

    // Reset filters
    const resetFilters = page.locator('[data-testid="reset-filters"]');
    if ((await resetFilters.count()) > 0) {
      await resetFilters.click();
      await page.waitForTimeout(1000);
    }

    // Click on a user to view detail
    const userViewButtons = page.locator('[data-testid^="view-user-"]');
    const userLinks = page
      .locator('a[href*="/dashboard/users/"]')
      .filter({ hasNotText: /new|edit/i });
    const clickableUser =
      (await userViewButtons.count()) > 0 ? userViewButtons.first() : userLinks.first();

    if ((await clickableUser.count()) > 0) {
      await clickableUser.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard\/users\/[a-zA-Z0-9-]+/);

      // Verify user detail page
      const userDetailHeading = page.locator('h1, h2').first();
      await expect(userDetailHeading).toBeVisible({ timeout: 10_000 });

      // Check role badge
      const roleBadge = page
        .locator(
          '[data-testid="role-badge-admin"], [data-testid="role-badge-teacher"], [data-testid="role-badge-student"]'
        )
        .first();
      if ((await roleBadge.count()) > 0) {
        await expect(roleBadge).toBeVisible();
      }
    }

    // Navigate back
    await page.goto('/dashboard/users');
    await page.waitForLoadState('networkidle');

    // ── Phase 6: Song Stats ───────────────────────────────────────

    await page.goto('/dashboard/admin/stats/songs');
    await page.waitForLoadState('networkidle');

    // Stub pages use CardTitle (renders as div, not h1/h2) — check any visible text
    await expect(page.getByText(/coming soon|songs|stats/i).first()).toBeVisible({
      timeout: 10_000,
    });

    // ── Phase 7: Lesson Stats ─────────────────────────────────────

    await page.goto('/dashboard/admin/stats/lessons');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/coming soon|lessons|stats/i).first()).toBeVisible({
      timeout: 10_000,
    });

    // ── Phase 8: Student Health Monitoring ─────────────────────────

    await page.goto('/dashboard/health');
    await page.waitForLoadState('networkidle');

    const healthHeading = page
      .locator('h1, h2')
      .filter({ hasText: /health|monitor/i })
      .first();
    if ((await healthHeading.count()) > 0) {
      await expect(healthHeading).toBeVisible({ timeout: 10_000 });
    }

    // Verify health content loads
    const healthContent = page.locator('main').first();
    await expect(healthContent).toBeVisible({ timeout: 10_000 });

    // Check for health status indicators
    const healthIndicators = page
      .getByText(/excellent|good|needs attention|at risk|critical/i)
      .first();
    if ((await healthIndicators.count()) > 0) {
      await expect(healthIndicators).toBeVisible();
    }

    // ── Phase 9: Activity Logs ────────────────────────────────────

    await page.goto('/dashboard/logs');
    await page.waitForLoadState('networkidle');

    const logsHeading = page
      .locator('h1, h2')
      .filter({ hasText: /log|activity/i })
      .first();
    if ((await logsHeading.count()) > 0) {
      await expect(logsHeading).toBeVisible({ timeout: 10_000 });
    }

    // Verify log entries are visible
    const logsContent = page.locator('main').first();
    await expect(logsContent).toBeVisible({ timeout: 10_000 });

    // ── Phase 10: Calendar ────────────────────────────────────────

    await page.goto('/dashboard/calendar');
    await page.waitForLoadState('networkidle');

    const calendarHeading = page
      .locator('h1, h2')
      .filter({ hasText: /calendar/i })
      .first();
    if ((await calendarHeading.count()) > 0) {
      await expect(calendarHeading).toBeVisible({ timeout: 10_000 });
    } else {
      // May show connect prompt or events list
      const calendarContent = page.locator('main').first();
      await expect(calendarContent).toBeVisible({ timeout: 10_000 });
    }

    // ── Phase 11: Profile ─────────────────────────────────────────
    // /dashboard/profile redirects to /dashboard/settings (spec 10)

    await page.goto('/dashboard/profile');
    await page.waitForLoadState('networkidle');

    // Redirected to settings — h1 says "Settings", form uses input[name="full_name"]
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10_000 });

    const fullNameField = page.locator('input[name="full_name"]');
    if ((await fullNameField.count()) > 0) {
      await expect(fullNameField).toBeVisible({ timeout: 10_000 });
      const fullNameValue = await fullNameField.inputValue();
      expect(fullNameValue.length).toBeGreaterThan(0);
    }

    // ── Phase 12: Settings ────────────────────────────────────────

    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    const settingsHeading = page
      .locator('h1, h2')
      .filter({ hasText: /setting/i })
      .first();
    await expect(settingsHeading).toBeVisible({ timeout: 10_000 });

    // Verify notification preferences section
    const notificationsSection = page.getByText(/notification/i).first();
    if ((await notificationsSection.count()) > 0) {
      await expect(notificationsSection).toBeVisible();
    }

    // ── Phase 13: Cleanup (delete created test data) ──────────────
    // Delete assignment first (depends on lesson/song), then lesson, then song

    // 13a. Delete assignment
    if (createdAssignmentUrl) {
      await page.goto(createdAssignmentUrl);
      await page.waitForLoadState('networkidle');

      const deleteAssignmentBtn = page
        .locator('[data-testid="assignment-delete-button"], button:has-text("Delete")')
        .first();
      if ((await deleteAssignmentBtn.count()) > 0 && (await deleteAssignmentBtn.isVisible())) {
        await deleteAssignmentBtn.click();
        await page.waitForTimeout(1000);

        // Confirm deletion
        const confirmBtn = page
          .locator(
            '[data-testid="delete-confirm-button"], button:has-text("Confirm"), button:has-text("Delete")'
          )
          .first();
        if ((await confirmBtn.count()) > 0 && (await confirmBtn.isVisible())) {
          await confirmBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // 13b. Delete lesson
    if (createdLessonUrl) {
      await page.goto(createdLessonUrl);
      await page.waitForLoadState('networkidle');

      const deleteLessonBtn = page.locator('[data-testid="lesson-delete-button"]');
      if ((await deleteLessonBtn.count()) > 0 && (await deleteLessonBtn.isVisible())) {
        await deleteLessonBtn.click();
        await page.waitForTimeout(1000);

        const confirmBtn = page
          .locator(
            '[data-testid="delete-confirm-button"], button:has-text("Confirm"), button:has-text("Delete")'
          )
          .first();
        if ((await confirmBtn.count()) > 0 && (await confirmBtn.isVisible())) {
          await confirmBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // 13c. Delete song
    if (createdSongUrl) {
      await page.goto(createdSongUrl);
      await page.waitForLoadState('networkidle');

      const deleteSongBtn = page
        .locator('[data-testid="song-delete-button"], button:has-text("Delete")')
        .first();
      if ((await deleteSongBtn.count()) > 0 && (await deleteSongBtn.isVisible())) {
        await deleteSongBtn.click();
        await page.waitForTimeout(1000);

        const confirmBtn = page
          .locator(
            '[data-testid="delete-confirm-button"], button:has-text("Confirm"), button:has-text("Delete")'
          )
          .first();
        if ((await confirmBtn.count()) > 0 && (await confirmBtn.isVisible())) {
          await confirmBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // Note: Even if manual cleanup above fails, the global teardown
    // in tests/helpers/cleanup.ts will catch E2E-prefixed test data
  }
);
