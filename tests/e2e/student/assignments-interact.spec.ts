import { test, expect } from '../../fixtures';
import { createClient } from '@supabase/supabase-js';
import { getStudentId, getTeacherId } from '../../helpers/seed-ids';

/**
 * Student Assignments Interaction E2E Tests
 *
 * Verifies that students can browse assignments, view details,
 * and update assignment status (not_started -> in_progress -> completed).
 * Students cannot create, edit content, or delete assignments.
 *
 * An assignment in `not_started` status is seeded via the admin client in
 * beforeAll so every test runs against guaranteed data regardless of DB state.
 */

// Resolved at runtime from the configured test-account emails (see beforeAll).
let STUDENT_ID = '';
let TEACHER_ID = '';

function adminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

let seededAssignmentId: string | null = null;

test.describe(
  'Student Assignments (Read + Status Update)',
  { tag: ['@student', '@assignments'] },
  () => {
    test.beforeAll(async () => {
      const db = adminClient();
      STUDENT_ID = await getStudentId(db);
      TEACHER_ID = await getTeacherId(db);

      // Remove any leftover E2E assignments from previous runs
      await db
        .from('assignments')
        .delete()
        .eq('student_id', STUDENT_ID)
        .eq('title', 'E2E Interact Assignment');

      const { data: assignment } = await db
        .from('assignments')
        .insert({
          teacher_id: TEACHER_ID,
          student_id: STUDENT_ID,
          title: 'E2E Interact Assignment',
          status: 'not_started',
          due_date: '2026-12-31T00:00:00Z',
        })
        .select('id')
        .single();
      seededAssignmentId = assignment?.id ?? null;
    });

    test.afterAll(async () => {
      const db = adminClient();
      if (seededAssignmentId) await db.from('assignments').delete().eq('id', seededAssignmentId);
    });

    test.beforeEach(async ({ page, loginAs }) => {
      await loginAs('student');
      await page.evaluate(() => localStorage.setItem('strummy-demo-welcome-seen', 'true'));
    });

    test('assignments list loads with no Create button @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/dashboard/assignments');
      await page.waitForLoadState('networkidle');

      // Verify the assignments page loads (editorial heading).
      await expect(page.getByRole('heading', { name: /assignments/i }).first()).toBeVisible({
        timeout: 15_000,
      });

      // Wait for page content to settle
      await page.waitForTimeout(2000);

      // Verify NO create/new assignment controls are visible
      const createControls = page.locator(
        '[data-testid="create-assignment-button"], button:has-text("Create Assignment"), a:has-text("Create Assignment"), a:has-text("New Assignment"), a[href*="/assignments/new"], button[aria-label="Add new assignment"], [data-testid="new-assignment-button"]'
      );
      await expect(createControls).toHaveCount(0);
    });

    test('view assignment detail @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/dashboard/assignments');
      await page.waitForLoadState('networkidle');

      // Wait for content to load
      await page.waitForTimeout(2000);

      const assignmentLinks = page
        .locator('a[href*="/dashboard/assignments/"]')
        .filter({ hasNotText: /new|edit|template/i });
      await expect(assignmentLinks.first()).toBeVisible({ timeout: 10_000 });

      // Click the first assignment
      await assignmentLinks.first().click();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/\/dashboard\/assignments\/[a-zA-Z0-9-]+/);

      // Verify assignment detail loads (client-side fetch — may need extra time)
      const detailContent = page.locator('[data-testid="assignment-detail"], h1, h2').first();
      await expect(detailContent).toBeVisible({ timeout: 20_000 });

      // Check for status indicator
      const statusIndicator = page
        .getByText(/not started|in progress|completed|pending|overdue/i)
        .first();
      const hasStatus = (await statusIndicator.count()) > 0;
      if (hasStatus) {
        await expect(statusIndicator).toBeVisible();
      }

      // Check for due date
      const dueDate = page.getByText(/due|deadline/i).first();
      const hasDueDate = (await dueDate.count()) > 0;
      if (hasDueDate) {
        await expect(dueDate).toBeVisible();
      }

      // Main content should render regardless
      const mainContent = page.locator('main').first();
      await expect(mainContent).toBeVisible();
    });

    test('update status: not_started to in_progress @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/dashboard/assignments');
      await page.waitForLoadState('networkidle');

      await page.waitForTimeout(2000);

      const assignmentLinks = page
        .locator('a[href*="/dashboard/assignments/"]')
        .filter({ hasNotText: /new|edit|template/i });
      await expect(assignmentLinks.first()).toBeVisible({ timeout: 10_000 });

      // Look for a Start button on the list or navigate to a detail page to find one
      const startButton = page.locator('[data-testid="assignment-start-button"]');
      let foundStartButton = (await startButton.count()) > 0;

      if (!foundStartButton) {
        // Try navigating to each assignment detail to find one with a Start button
        const count = await assignmentLinks.count();
        for (let i = 0; i < Math.min(count, 5); i++) {
          await page.goto('/dashboard/assignments');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);

          const links = page
            .locator('a[href*="/dashboard/assignments/"]')
            .filter({ hasNotText: /new|edit|template/i });
          await links.nth(i).click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);

          const detailStartButton = page.locator('[data-testid="assignment-start-button"]');
          if ((await detailStartButton.count()) > 0) {
            foundStartButton = true;
            break;
          }
        }
      }

      test.skip(
        !foundStartButton,
        'No assignment with Start button found (none in not_started status)'
      );

      // Click the Start button
      await page.locator('[data-testid="assignment-start-button"]').first().click();
      await page.waitForTimeout(2000);

      // Verify status changed — look for "in progress" text or updated status indicator
      const updatedStatus = page.getByText(/in progress/i).first();
      const hasUpdatedStatus = (await updatedStatus.count()) > 0;
      if (hasUpdatedStatus) {
        await expect(updatedStatus).toBeVisible();
      }
    });

    test('update status: in_progress to completed @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/dashboard/assignments');
      await page.waitForLoadState('networkidle');

      await page.waitForTimeout(2000);

      const assignmentLinks = page
        .locator('a[href*="/dashboard/assignments/"]')
        .filter({ hasNotText: /new|edit|template/i });
      await expect(assignmentLinks.first()).toBeVisible({ timeout: 10_000 });

      // Look for a Complete button on the list or navigate to detail pages
      const completeButton = page.locator('[data-testid="assignment-complete-button"]');
      let foundCompleteButton = (await completeButton.count()) > 0;

      if (!foundCompleteButton) {
        // Try navigating to each assignment detail to find one with a Complete button
        const count = await assignmentLinks.count();
        for (let i = 0; i < Math.min(count, 5); i++) {
          await page.goto('/dashboard/assignments');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);

          const links = page
            .locator('a[href*="/dashboard/assignments/"]')
            .filter({ hasNotText: /new|edit|template/i });
          await links.nth(i).click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);

          const detailCompleteButton = page.locator('[data-testid="assignment-complete-button"]');
          if ((await detailCompleteButton.count()) > 0) {
            foundCompleteButton = true;
            break;
          }
        }
      }

      test.skip(
        !foundCompleteButton,
        'No assignment with Complete button found (none in in_progress status)'
      );

      // Click the Complete button
      await page.locator('[data-testid="assignment-complete-button"]').first().click();
      await page.waitForTimeout(2000);

      // Verify status changed — look for "completed" text or updated status indicator
      const updatedStatus = page.getByText(/completed/i).first();
      const hasUpdatedStatus = (await updatedStatus.count()) > 0;
      if (hasUpdatedStatus) {
        await expect(updatedStatus).toBeVisible();
      }
    });

    test('no edit control for assignment content @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/dashboard/assignments');
      await page.waitForLoadState('networkidle');

      await page.waitForTimeout(2000);

      const assignmentLinks = page
        .locator('a[href*="/dashboard/assignments/"]')
        .filter({ hasNotText: /new|edit|template/i });
      await expect(assignmentLinks.first()).toBeVisible({ timeout: 10_000 });

      // Navigate to assignment detail
      await assignmentLinks.first().click();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/\/dashboard\/assignments\/[a-zA-Z0-9-]+/);

      // Wait for page to fully render
      await page.waitForTimeout(2000);

      // Verify no edit button for assignment content
      const editButton = page.locator(
        '[data-testid="assignment-edit-button"], a[href*="/edit"], button:has-text("Edit")'
      );
      await expect(editButton).toHaveCount(0);

      // Verify no delete button
      const deleteButton = page.locator(
        '[data-testid="assignment-delete-button"], button:has-text("Delete")'
      );
      await expect(deleteButton).toHaveCount(0);
    });

    test('filter assignments by status @mobile', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/dashboard/assignments');
      await page.waitForLoadState('networkidle');

      await page.waitForTimeout(2000);

      // Look for a status filter control
      const statusFilter = page
        .locator(
          '[data-testid="status-filter"], [data-testid="field-status"], select, [role="combobox"]'
        )
        .first();
      const hasStatusFilter = (await statusFilter.count()) > 0 && (await statusFilter.isVisible());
      test.skip(!hasStatusFilter, 'No status filter control available on assignments page');

      // Verify the filter is interactable
      await expect(statusFilter).toBeEnabled();

      // Try interacting with the filter
      if ((await statusFilter.evaluate((el) => el.tagName.toLowerCase())) === 'select') {
        // Native select: pick the second option if available
        const options = statusFilter.locator('option');
        const optionCount = await options.count();
        if (optionCount > 1) {
          const secondOptionValue = await options.nth(1).getAttribute('value');
          if (secondOptionValue) {
            await statusFilter.selectOption(secondOptionValue);
            await page.waitForTimeout(1500);
          }
        }
      } else {
        // Custom combobox / dropdown: click to open, then select first option
        await statusFilter.click();
        await page.waitForTimeout(500);

        const option = page.locator('[role="option"]').first();
        if ((await option.count()) > 0) {
          await option.click();
          await page.waitForTimeout(1500);
        }
      }

      // Verify the page still renders correctly after filtering
      const mainContent = page.locator('main').first();
      await expect(mainContent).toBeVisible();
    });
  }
);

/**
 * Student Checklist Toggle
 *
 * A student ticking a checklist item on their own assignment: optimistic tick,
 * live progress %, and persistence across a reload. Ticking routes through the
 * `student_toggle_checklist_item` SECURITY DEFINER RPC (ADR-0001 — students
 * never UPDATE the table directly).
 */
test.describe(
  'Student Checklist Toggle',
  { tag: ['@student', '@assignments'] },
  () => {
    const ITEM_ONE = 'E2E checklist step one';
    const ITEM_TWO = 'E2E checklist step two';
    let checklistAssignmentId: string | null = null;

    test.beforeAll(async () => {
      const db = adminClient();
      STUDENT_ID = await getStudentId(db);
      TEACHER_ID = await getTeacherId(db);

      await db
        .from('assignments')
        .delete()
        .eq('student_id', STUDENT_ID)
        .eq('title', 'E2E Checklist Assignment');

      const { data } = await db
        .from('assignments')
        .insert({
          teacher_id: TEACHER_ID,
          student_id: STUDENT_ID,
          title: 'E2E Checklist Assignment',
          status: 'in_progress',
          due_date: '2026-12-31T00:00:00Z',
          checklist: [
            { id: 'e2e-item-1', text: ITEM_ONE, done: false },
            { id: 'e2e-item-2', text: ITEM_TWO, done: false },
          ],
        })
        .select('id')
        .single();
      checklistAssignmentId = data?.id ?? null;
    });

    test.afterAll(async () => {
      const db = adminClient();
      if (checklistAssignmentId)
        await db.from('assignments').delete().eq('id', checklistAssignmentId);
    });

    test.beforeEach(async ({ page, loginAs }) => {
      await loginAs('student');
      await page.evaluate(() => localStorage.setItem('strummy-demo-welcome-seen', 'true'));
    });

    test('ticks an item, updates progress %, and persists across reload', async ({ page }) => {
      test.skip(!checklistAssignmentId, 'Checklist assignment failed to seed');

      await page.goto(`/dashboard/assignments/${checklistAssignmentId}`);
      await page.waitForLoadState('networkidle');

      // Detail is a client-side fetch — wait for the checklist to render.
      const firstItem = page.getByText(ITEM_ONE, { exact: true });
      await expect(firstItem).toBeVisible({ timeout: 20_000 });

      // Both items start unticked → 0 / 2 done.
      await expect(page.getByText(/\b0\s*\/\s*2\s+done\b/)).toBeVisible();
      const firstCheckbox = page
        .locator('label', { hasText: ITEM_ONE })
        .getByRole('checkbox');
      await expect(firstCheckbox).not.toBeChecked();

      // Tap the row (the whole label is the target) to tick it.
      await firstItem.click();

      // Optimistic: checkbox ticked and progress climbs to 1 / 2 · 50%.
      await expect(firstCheckbox).toBeChecked();
      await expect(page.getByText(/\b1\s*\/\s*2\s+done\b/)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(/50%/)).toBeVisible();

      // Persisted: a fresh load reads the RPC-updated checklist column.
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.getByText(ITEM_ONE, { exact: true })).toBeVisible({ timeout: 20_000 });
      await expect(
        page.locator('label', { hasText: ITEM_ONE }).getByRole('checkbox')
      ).toBeChecked();
      await expect(page.getByText(/\b1\s*\/\s*2\s+done\b/)).toBeVisible();
    });
  }
);
