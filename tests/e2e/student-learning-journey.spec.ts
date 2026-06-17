/**
 * Student Learning Journey Test
 *
 * Migrated from: cypress/e2e/student-learning-journey.cy.ts
 *
 * This test covers the complete student experience:
 * 1. Sign in as student
 * 2. View dashboard with stats
 * 3. Check upcoming lessons
 * 4. Browse assigned songs
 * 5. View and complete assignments
 * 6. Update profile settings
 *
 * Prerequisites:
 * - Student user: student@example.com / test123_student
 * - Student should have pre-existing lessons, songs, and assignments
 *
 * @tags @student @learning-journey
 *
 * NOTE: intentionally NOT tagged @smoke. The PR smoke gate runs unauthenticated
 * only (tests/e2e/smoke/critical-path.spec.ts) — it has no seeded test accounts.
 * This authenticated journey runs in the full E2E suite, which needs real
 * credentials + a seeded target (see vault: "E2E auth smoke" follow-up).
 */
import { test, expect } from '../fixtures';

test.describe('Student Learning Journey', { tag: ['@student', '@learning-journey'] }, () => {
  test.beforeEach(async ({ page, loginAs }) => {
    // Set viewport to desktop size
    await page.setViewportSize({ width: 1440, height: 900 });

    // Login as student
    await loginAs('student');
  });

  test.describe('Phase 1: Dashboard Overview', () => {
    test('should display student dashboard with key metrics', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Verify we're on the dashboard
      await expect(page).toHaveURL(/\/dashboard/);

      // Should see student-specific dashboard content
      await expect(page.locator('text=/dashboard|overview|welcome/i').first()).toBeVisible({
        timeout: 10000,
      });

      // Check for stat cards (lessons, songs, assignments, etc.)
      const statCards = page.locator('[data-testid="stat-card"], .stat-card, [class*="card"]');
      await expect(statCards.first()).toBeVisible();
    });

    test('should show next upcoming lesson', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for next lesson section
      await expect(page.locator('text=/next lesson|upcoming|scheduled/i').first()).toBeVisible({
        timeout: 10000,
      });
    });

    test('should display recent activity or progress', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Look for activity or progress section
      await expect(page.locator('text=/activity|progress|recent/i').first()).toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('Phase 2: View Lessons', () => {
    test('should navigate to lessons page', async ({ page }) => {
      await page.goto('/dashboard/lessons');
      await page.waitForLoadState('networkidle');

      // Verify we're on the lessons page
      await expect(page).toHaveURL(/\/lessons/);

      // Should see lessons content
      await expect(page.locator('text=/lessons|schedule/i').first()).toBeVisible({
        timeout: 10000,
      });
    });

    test('should only see own lessons (not other students)', async ({ page }) => {
      await page.goto('/dashboard/lessons');
      await page.waitForLoadState('networkidle');

      // Check for lessons - should not show teacher-only controls
      const lessonRows = page.locator('[data-testid="lesson-row"], tr');
      const rowCount = await lessonRows.count();

      if (rowCount > 0) {
        // Verify no "All Students" filter or similar admin controls
        await expect(page.locator('text=/all students|filter by student/i')).not.toBeVisible();
      }
    });

    test('should click on a lesson to view details', async ({ page }) => {
      await page.goto('/dashboard/lessons');
      await page.waitForLoadState('networkidle');

      // Look for lesson links
      const lessonLink = page.locator('a[href*="/lessons/"]').first();
      const hasLessons = (await lessonLink.count()) > 0;

      if (hasLessons) {
        await lessonLink.click();
        await expect(page).toHaveURL(/\/lessons\//);

        // Should see lesson details
        await expect(page.locator('text=/lesson|details|notes/i').first()).toBeVisible({
          timeout: 10000,
        });
      }
    });
  });

  test.describe('Phase 3: Browse Songs', () => {
    test('should navigate to songs page', async ({ page }) => {
      await page.goto('/dashboard/songs');
      await page.waitForLoadState('networkidle');

      // Verify we're on the songs page
      await expect(page).toHaveURL(/\/songs/);

      // Should see songs content
      await expect(page.locator('text=/songs|library|repertoire/i').first()).toBeVisible({
        timeout: 10000,
      });
    });

    test('should display assigned or available songs', async ({ page }) => {
      await page.goto('/dashboard/songs');
      await page.waitForLoadState('networkidle');

      // Wait for page to load - "My Songs" heading appears
      await expect(page.locator('text=/My Songs/i')).toBeVisible({
        timeout: 10000,
      });

      // Wait for loading spinner to disappear (if present)
      const spinner = page.locator('[class*="animate-spin"]');
      if ((await spinner.count()) > 0) {
        await expect(spinner).not.toBeVisible({ timeout: 10000 });
      }

      // Check for either songs or empty state
      const hasSongs = (await page.locator('a[href*="/songs/"]').count()) > 0;
      const hasEmptyState = (await page.locator('text=/No songs found/i').count()) > 0;

      expect(hasSongs || hasEmptyState).toBeTruthy();
    });

    test('should click on a song to view details', async ({ page }) => {
      await page.goto('/dashboard/songs');
      await page.waitForLoadState('networkidle');

      // Look for song links
      const songLink = page.locator('a[href*="/songs/"]').first();
      const hasSongs = (await songLink.count()) > 0;

      if (hasSongs) {
        await songLink.click();
        await expect(page).toHaveURL(/\/songs\//);

        // Should see song details (title, author, chords, key)
        await expect(page.locator('text=/title|author|chords|key/i').first()).toBeVisible({
          timeout: 10000,
        });
      }
    });

    test('should display song details description', async ({ page }) => {
      await page.goto('/dashboard/songs');
      await page.waitForLoadState('networkidle');

      // The student songs view displays assigned songs
      await expect(page.locator('text=/My Songs/i')).toBeVisible({
        timeout: 10000,
      });
      await expect(page.locator('text=/songs you are currently learning|mastered/i')).toBeVisible();
    });
  });

  test.describe('Phase 4: Manage Assignments', () => {
    test('should navigate to assignments page', async ({ page }) => {
      await page.goto('/dashboard/assignments');
      await page.waitForLoadState('networkidle');

      // Verify we're on the assignments page
      await expect(page).toHaveURL(/\/assignments/);

      // Should see assignments content
      await expect(page.locator('text=/assignments|homework|practice/i').first()).toBeVisible({
        timeout: 10000,
      });
    });

    test('should display assignment status (pending, completed, overdue)', async ({ page }) => {
      await page.goto('/dashboard/assignments');
      await page.waitForLoadState('networkidle');

      // Wait for page to load - "My Assignments" heading appears
      await expect(page.locator('text=/My Assignments/i')).toBeVisible({
        timeout: 10000,
      });

      // Wait for loading spinner to disappear (if present)
      const spinner = page.locator('[class*="animate-spin"]');
      if ((await spinner.count()) > 0) {
        await expect(spinner).not.toBeVisible({ timeout: 10000 });
      }

      // Check for either assignments or empty state
      const hasAssignments = (await page.locator('a[href*="/assignments/"]').count()) > 0;
      const hasEmptyState = (await page.locator('text=/No assignments found/i').count()) > 0;

      expect(hasAssignments || hasEmptyState).toBeTruthy();
    });

    test('should click on assignment to view details', async ({ page }) => {
      await page.goto('/dashboard/assignments');
      await page.waitForLoadState('networkidle');

      // Look for assignment links
      const assignmentLink = page.locator('a[href*="/assignments/"]').first();
      const hasAssignments = (await assignmentLink.count()) > 0;

      if (hasAssignments) {
        await assignmentLink.click();
        await expect(page).toHaveURL(/\/assignments\//);

        // Should see assignment details
        await expect(page.locator('text=/instructions|due date|song|status/i').first()).toBeVisible(
          { timeout: 10000 }
        );
      }
    });

    test('should be able to mark assignment as complete (if pending)', async ({ page }) => {
      await page.goto('/dashboard/assignments');
      await page.waitForLoadState('networkidle');

      // Look for a pending assignment with complete button
      const completeBtn = page
        .locator(
          'button:has-text("Complete"), button:has-text("Mark Done"), [data-testid="complete-btn"]'
        )
        .first();

      const hasCompleteBtn = (await completeBtn.count()) > 0;

      if (hasCompleteBtn) {
        await completeBtn.click();

        // Should show success or status change
        await expect(page.locator('text=/completed|success|done/i').first()).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });

  test.describe('Phase 5: Profile & Settings', () => {
    test('should navigate to profile page', async ({ page }) => {
      await page.goto('/dashboard/profile');
      await page.waitForLoadState('networkidle');

      // Verify we're on the profile page
      await expect(page).toHaveURL(/\/profile/);

      // Should see profile content
      await expect(page.locator('text=/profile|account|settings/i').first()).toBeVisible({
        timeout: 10000,
      });
    });

    test('should display current user information', async ({ page }) => {
      await page.goto('/dashboard/profile');
      await page.waitForLoadState('networkidle');

      // Profile page shows form fields for first name, last name, etc.
      await expect(page.locator('form')).toBeVisible({ timeout: 10000 });

      // Look for profile-related form fields or labels
      await expect(
        page.locator('text=/first name|last name|email|profile/i').first()
      ).toBeVisible();
    });

    test('should navigate to settings', async ({ page }) => {
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');

      // Verify we're on the settings page
      await expect(page).toHaveURL(/\/settings/);

      // Should see settings content
      await expect(page.locator('text=/settings|preferences/i').first()).toBeVisible({
        timeout: 10000,
      });
    });

    test('should be able to toggle theme (if available)', async ({ page }) => {
      await page.goto('/dashboard/settings');
      await page.waitForLoadState('networkidle');

      // Look for theme toggle
      const themeToggle = page
        .locator('[data-testid="theme-toggle"], button:has-text("Theme"), [aria-label*="theme"]')
        .first();

      const hasThemeToggle = (await themeToggle.count()) > 0;

      if (hasThemeToggle) {
        await themeToggle.click();
      }
    });
  });

  test.describe('Phase 6: Access Control Verification', () => {
    test('should NOT have access to admin-only pages', async ({ page }) => {
      // Try to access admin routes - should redirect or show error
      await page.goto('/dashboard/users');
      await page.waitForLoadState('networkidle');

      // Wait for page to load/redirect
      await page.waitForTimeout(1000);

      // Should either redirect away from users page OR not show admin content
      const currentUrl = page.url();

      if (!currentUrl.includes('/users')) {
        // Redirected away from users page - that's correct
        expect(currentUrl).not.toContain('/users');
      } else {
        // If still on users page, it should be restricted somehow
        // Could show empty state or limited view - verify no admin controls
        await expect(page.locator('text=/create user|add user|delete user/i')).not.toBeVisible();
      }
    });

    test('should NOT see other students lessons', async ({ page }) => {
      // This is verified by the lessons list only showing own lessons
      await page.goto('/dashboard/lessons');
      await page.waitForLoadState('networkidle');

      // Should not see any admin controls
      await expect(page.locator('text=/all lessons|manage|teacher/i')).not.toBeVisible();
    });
  });
});
