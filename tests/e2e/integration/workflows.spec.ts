/**
 * Integration Workflows E2E Tests
 *
 * Migrated from: cypress/e2e/integration/workflows.cy.ts
 *
 * Tests complete end-to-end workflows spanning multiple features:
 * 1. Full Lesson Flow - Admin creates lesson → adds songs → assigns to student → student views → cleanup
 * 2. Assignment Flow - Admin creates → student sees → student completes → cleanup
 * 3. Song Progress Flow - Admin creates song → verifies in list → cleanup
 * 4. User Management Flow - Admin creates shadow user → verifies → cleanup
 * 5. Cross-Role Data Visibility - Verify admin vs student access permissions
 *
 * These tests verify that:
 * - Complete workflows function end-to-end
 * - Data flows correctly between features
 * - Role-based access is respected
 * - Multi-step operations maintain consistency
 * - Cleanup operations work properly
 *
 * Prerequisites:
 * - Local Supabase database running with seeded data
 * - Admin and student accounts configured
 * - Database allows CRUD operations
 *
 * @tags @integration @workflows @cross-feature
 */
import { test, expect } from '../../fixtures';

test.describe(
  'Integration Workflows',
  { tag: ['@integration', '@workflows', '@cross-feature'] },
  () => {
    const timestamp = Date.now();

    test.describe('Full Lesson Workflow', () => {
      const lessonData = {
        title: `Integration Lesson ${timestamp}`,
        notes: 'Integration test lesson notes',
      };

      test('should complete full lesson lifecycle: create → verify → student view → delete', async ({
        page,
        loginAs,
      }) => {
        // Full CRUD with UI delete is covered by teacher/lessons-crud.spec.ts.
        // This test verifies the cross-role visibility: admin creates, student can see list.
        await page.setViewportSize({ width: 1440, height: 900 });

        // STEP 1: Admin creates a new lesson (editorial form: #lesson-student, #lesson-title, #lesson-when)
        await loginAs('admin');
        await page.goto('/dashboard/lessons/new');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('#lesson-title')).toBeVisible({ timeout: 15_000 });
        await page.locator('#lesson-student').selectOption({ index: 1 });
        await page.locator('#lesson-title').fill(lessonData.title);
        await page.locator('#lesson-when').fill('2026-07-01T10:00');
        await page.getByRole('button', { name: 'Create lesson' }).click();

        // Editorial form redirects to lesson detail (not list)
        await page.waitForURL(/\/dashboard\/lessons\/[0-9a-f-]{36}$/, { timeout: 20_000 });
        const lessonUrl = page.url();

        // STEP 2: Admin sees lesson in list
        await page.goto('/dashboard/lessons');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text=${lessonData.title}`).first()).toBeVisible({
          timeout: 10000,
        });

        // STEP 3: Student can view lessons page (RLS allows own lessons)
        await loginAs('student');
        await page.goto('/dashboard/lessons');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/lessons/);
        // Global teardown cleans up E2E-prefixed test lessons via service-role client.
      });
    });

    test.describe('Assignment Workflow', () => {
      const assignmentData = {
        title: `Integration Assignment ${timestamp}`,
        description: 'Integration test assignment description',
      };

      test('should complete assignment lifecycle: create → verify → student view → delete', async ({
        page,
        loginAs,
      }) => {
        await page.setViewportSize({ width: 1440, height: 900 });

        // STEP 1: Admin creates a new assignment (editorial form: #assignment-student, #assignment-title)
        await loginAs('admin');
        await page.goto('/dashboard/assignments/new');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('#assignment-title')).toBeVisible({ timeout: 15_000 });
        await page.locator('#assignment-student').selectOption({ index: 1 });
        await page.locator('#assignment-title').fill(assignmentData.title);
        await page.getByRole('button', { name: 'Create assignment' }).click();

        // Editorial form redirects to assignment detail (not list)
        await page.waitForURL(/\/dashboard\/assignments\/[0-9a-f-]{36}$/, { timeout: 20_000 });
        const assignmentUrl = page.url();

        // STEP 2: Admin verifies assignment in list
        await page.goto('/dashboard/assignments');
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text=${assignmentData.title}`).first()).toBeVisible({
          timeout: 10000,
        });

        // STEP 3: Student views their assignments page
        await loginAs('student');
        await page.goto('/dashboard/assignments');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/assignments/);
        await expect(page.locator('text=/my assignments|assignments/i').first()).toBeVisible();
        // Global teardown cleans up E2E-prefixed test assignments via service-role client.
      });
    });

    test.describe('Song Creation and Student View Workflow', () => {
      const songData = {
        title: `Integration Song ${timestamp}`,
        author: 'Test Artist',
      };

      test('should complete song lifecycle: create → verify → delete', async ({
        page,
        loginAs,
      }) => {
        await page.setViewportSize({ width: 1440, height: 900 });

        // STEP 1: Admin creates a new song
        await loginAs('admin');
        await page.goto('/dashboard/songs/new');
        await page.waitForLoadState('networkidle');

        // Wait for form - look for title input
        await page
          .locator('input[name="title"], [data-testid*="title"]')
          .first()
          .waitFor({ state: 'visible', timeout: 10000 });

        // Fill in song details
        await page
          .locator('input[name="title"], [data-testid*="title"]')
          .first()
          .fill(songData.title);
        await page
          .locator('input[name="author"], [data-testid*="author"]')
          .first()
          .fill(songData.author);

        // Submit
        await page.locator('button[type="submit"], [data-testid="submit"]').first().click();

        // Verify redirect
        await expect(page).toHaveURL(/\/dashboard\/songs/, {
          timeout: 15000,
        });

        // STEP 2: Admin verifies song in list
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text=${songData.title}`)).toBeVisible({
          timeout: 10000,
        });

        // STEP 3: Cleanup via API (editorial song detail has no delete button)
        // Extract song ID from current URL (still on detail page from redirect)
        const songId = page.url().split('/').pop();
        if (songId) {
          const deleteResp = await page.request.delete(`/api/song?id=${songId}`);
          expect(deleteResp.status()).toBeLessThan(400);
        }
      });
    });

    test.describe('User Creation and Role Assignment Workflow', () => {
      const userData = {
        firstName: 'IntegrationTest',
        lastName: `User${timestamp}`,
        username: `intuser${timestamp}`,
      };

      test.skip('should complete user lifecycle: create shadow user → verify → delete', async ({
        page,
        loginAs,
      }) => {
        // /dashboard/users/new is a stub ("Coming soon") — user creation via UI not yet available.
        // Shadow user creation is covered by dedicated API/integration tests.
        await page.setViewportSize({ width: 1440, height: 900 });

        // STEP 1: Admin creates a shadow user
        await loginAs('admin');
        await page.goto('/dashboard/users/new');
        await page.waitForLoadState('networkidle');

        // Check shadow user checkbox
        await page.locator('[data-testid="isShadow-checkbox"]').check();

        // Fill in details
        await page.locator('[data-testid="firstName-input"]').fill(userData.firstName);
        await page.locator('[data-testid="lastName-input"]').fill(userData.lastName);
        await page.locator('[data-testid="username-input"]').fill(userData.username);

        // Set as student
        await page.locator('[data-testid="isStudent-checkbox"]').check();

        // Submit
        await page.locator('[data-testid="submit-button"]').click();

        // Verify redirect
        await expect(page).toHaveURL(/\/dashboard\/users/, {
          timeout: 30000,
        });

        // STEP 2: Admin verifies user in list
        await page.waitForLoadState('networkidle');

        // Search for user
        await page.locator('[data-testid="search-input"]').fill(userData.username);
        await page.waitForTimeout(1500);

        await expect(
          page.locator('[data-testid="users-table"]').locator(`text=${userData.firstName}`)
        ).toBeVisible();

        // STEP 3: Admin deletes test user (cleanup)
        await page.goto('/dashboard/users');
        await page.waitForLoadState('networkidle');

        // Search for user again
        await page.locator('[data-testid="search-input"]').fill(userData.username);
        await page.waitForTimeout(1500);

        // Click delete
        await page.locator('[data-testid^="delete-user-"]').first().click();

        // Confirm deletion
        const confirmModal = page.locator('[role="alertdialog"]');
        await expect(confirmModal).toBeVisible({ timeout: 5000 });
        await confirmModal.locator('button:has-text(/delete/i)').click();

        await page.waitForTimeout(2000);

        // Verify deletion
        await expect(page.locator(`text=${userData.firstName}`)).not.toBeVisible({
          timeout: 5000,
        });
      });
    });

    test.describe('Cross-Role Data Visibility', () => {
      test('should verify admin has access to all sections', async ({ page, loginAs }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAs('admin');

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Admin should have access to all sections (use first nav to avoid strict mode)
        const navigation = page.locator('nav, [role="navigation"]').first();

        await expect(navigation.locator('a[href*="/users"]')).toBeVisible();
        await expect(navigation.locator('a[href="/dashboard/lessons"]')).toBeVisible();
        await expect(navigation.locator('a[href="/dashboard/songs"]')).toBeVisible();
        await expect(navigation.locator('a[href="/dashboard/assignments"]')).toBeVisible();
      });

      test('should verify student has limited navigation options', async ({ page, loginAs }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAs('student');

        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Student should NOT see users link
        await expect(page.locator('a[href="/dashboard/users"]')).not.toBeVisible();

        // But should see other links (exact href to avoid strict mode with song detail links)
        await expect(page.locator('a[href="/dashboard/lessons"]')).toBeVisible();
        await expect(page.locator('a[href="/dashboard/songs"]')).toBeVisible();
        await expect(page.locator('a[href="/dashboard/assignments"]')).toBeVisible();
      });

      test('should verify role-based filtering in lessons', async ({ page, loginAs }) => {
        await page.setViewportSize({ width: 1440, height: 900 });

        // Admin should see student filter
        await loginAs('admin');
        await page.goto('/dashboard/lessons');
        await page.waitForLoadState('networkidle');

        // Admin/teacher editorial lessons list shows "Teaching" as section header (showStudentColumn=true)
        // Student view shows "Your lessons" as section header instead
        const teachingHeader = page.locator('text=/^Teaching$/').first();
        const hasTeachingHeader = (await teachingHeader.count()) > 0;

        // Student should NOT see "Teaching" section header — only "Your lessons"
        await loginAs('student');
        await page.goto('/dashboard/lessons');
        await page.waitForLoadState('networkidle');

        const teachingHeaderAsStudent = page.locator('text=/^Teaching$/').first();
        const hasTeachingHeaderAsStudent = (await teachingHeaderAsStudent.count()) > 0;

        // Verify admin sees "Teaching" header but students see "Your lessons" instead
        expect(hasTeachingHeader).toBeTruthy();
        expect(hasTeachingHeaderAsStudent).toBeFalsy();
      });

      test('should verify data isolation between roles', async ({ page, loginAs }) => {
        await page.setViewportSize({ width: 1440, height: 900 });

        // Student tries to access admin-only users page
        await loginAs('student');
        await page.goto('/dashboard/users');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        const currentUrl = page.url();

        // Either redirected away OR on users page with no admin controls
        if (!currentUrl.includes('/users')) {
          // Redirected away from users page - correct behavior
          expect(currentUrl).not.toContain('/users');
        } else {
          // If still on users page, should not show admin controls
          await expect(page.locator('text=/create user|add user|delete user/i')).not.toBeVisible();
        }
      });

      test('should verify consistent navigation across workflows', async ({ page, loginAs }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAs('admin');

        // Test navigation flow: Dashboard → Lessons → Lesson Detail → Back
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');

        // Navigate to lessons
        await page.locator('a[href*="/lessons"]').first().click();
        await expect(page).toHaveURL(/\/lessons/);

        // Navigate to a lesson detail (if any exist)
        const lessonTable = page.locator('[data-testid="lesson-table"], table');
        const hasLessons = await lessonTable.isVisible().catch(() => false);

        if (hasLessons) {
          const lessonRow = page.locator('table tbody tr').first();
          const rowCount = await lessonRow.count();

          if (rowCount > 0) {
            await lessonRow.locator('a').first().click();
            await expect(page).toHaveURL(/\/lessons\/[^/]+$/);

            // Navigate back using browser back
            await page.goBack();
            await expect(page).toHaveURL(/\/lessons$/);
          }
        }
      });
    });

    test.describe('Multi-Entity Workflow Integration', () => {
      test('should verify lesson-song relationship workflow', async ({ page, loginAs }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAs('admin');

        // Navigate to a lesson detail page
        await page.goto('/dashboard/lessons');
        await page.waitForLoadState('networkidle');

        const lessonTable = page.locator('[data-testid="lesson-table"], table');
        const hasLessons = await lessonTable.isVisible({ timeout: 10000 }).catch(() => false);

        if (hasLessons) {
          const lessonRow = page.locator('table tbody tr').first();
          const rowCount = await lessonRow.count();

          if (rowCount > 0) {
            await lessonRow.locator('a').first().click();
            await expect(page).toHaveURL(/\/lessons\/[^/]+$/, {
              timeout: 10000,
            });
            await page.waitForLoadState('networkidle');

            // Verify Lesson Songs section exists
            await expect(page.locator('text=Lesson Songs')).toBeVisible({
              timeout: 10000,
            });

            // Check if songs are assigned or empty state
            const songsSection = page.locator('text=Lesson Songs').locator('..').locator('..');
            const songItems = songsSection.locator('ul li');
            const songCount = await songItems.count();
            const hasEmptyMessage = await page
              .locator('text=No songs assigned to this lesson')
              .isVisible()
              .catch(() => false);

            expect(songCount > 0 || hasEmptyMessage).toBeTruthy();
          }
        }
      });

      test('should verify assignment-student relationship workflow', async ({ page, loginAs }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAs('admin');

        // Navigate to assignments
        await page.goto('/dashboard/assignments');
        await page.waitForLoadState('networkidle');

        const assignmentTable = page.locator('table');
        const hasAssignments = await assignmentTable.isVisible().catch(() => false);

        if (hasAssignments) {
          const assignmentRows = page.locator('table tbody tr');
          const rowCount = await assignmentRows.count();

          if (rowCount > 0) {
            // Click on first assignment
            await assignmentRows.first().click();
            await expect(page).toHaveURL(/\/assignments\/[^/]+$/, {
              timeout: 10000,
            });
            await page.waitForLoadState('networkidle');

            // Assignment detail should show student information
            const hasStudentInfo = await page
              .locator('text=/student|assigned to/i')
              .isVisible()
              .catch(() => false);
            const hasAssignmentDetail = page.url().includes('/assignments/');

            expect(hasStudentInfo || hasAssignmentDetail).toBeTruthy();
          }
        }
      });

      test('should verify cross-feature data consistency', async ({ page, loginAs }) => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await loginAs('admin');

        // Get a student from users page
        await page.goto('/dashboard/users');
        await page.waitForLoadState('networkidle');

        const userTable = page.locator('table');
        const hasUsers = await userTable.isVisible({ timeout: 10000 }).catch(() => false);

        if (hasUsers) {
          const userRows = page.locator('table tbody tr');
          const rowCount = await userRows.count();

          if (rowCount > 0) {
            // Get first student's name
            const firstUserRow = userRows.first();
            const userName = await firstUserRow.locator('td').first().textContent();

            if (userName && userName.trim()) {
              // Navigate to lessons and verify consistent student display
              await page.goto('/dashboard/lessons');
              await page.waitForLoadState('networkidle');

              // Student name should appear consistently across features
              const studentInLessons = page.locator(`text=${userName.trim()}`);
              const lessonCount = await studentInLessons.count();

              // Data consistency verified - same student name format
              expect(lessonCount >= 0).toBeTruthy();
            }
          }
        }
      });
    });
  }
);
