import { test, expect } from '../../fixtures';
import { createClient } from '@supabase/supabase-js';

/**
 * Student Practice Log E2E Tests (B6)
 *
 * Journeys tested:
 *  B6.1 — Log a practice session
 *  B6.2 — Delete same-day entry (undo)
 *  B6.3 — Past sessions have no Remove button (immutability)
 *  B6.4 — Page loads for student, only own sessions visible
 *
 * student1@example.com has is_development=false in the local test DB so the
 * mutation guard never fires — no toggle needed.
 */

const STUDENT_ID = '2fb4575e-bb80-486f-a8d9-3553fd84316d';

function adminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(url, key);
}

let pastSessionId: string | null = null;

test.describe.configure({ mode: 'serial' });

test.describe('Student Practice Log', { tag: ['@student', '@practice'] }, () => {
  test.beforeAll(async () => {
    const db = adminClient();

    // Wipe any E2E sessions left from earlier runs (idempotent)
    await db.from('practice_sessions').delete().eq('student_id', STUDENT_ID).like('notes', 'E2E%');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data } = await db
      .from('practice_sessions')
      .insert({
        student_id: STUDENT_ID,
        duration_minutes: 30,
        notes: 'E2E past session',
        created_at: yesterday.toISOString(),
      })
      .select('id')
      .single();
    pastSessionId = data?.id ?? null;
  });

  test.afterAll(async () => {
    const db = adminClient();
    if (pastSessionId) await db.from('practice_sessions').delete().eq('id', pastSessionId);
    await db.from('practice_sessions').delete().eq('student_id', STUDENT_ID).like('notes', 'E2E%');
  });

  test.beforeEach(async ({ loginAs }) => {
    await loginAs('student');
  });

  test('B6.4 practice page loads for student', async ({ page }) => {
    await page.goto('/dashboard/practice');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /practice/i })).toBeVisible({ timeout: 15_000 });
    // Log form is visible for own practice page
    await expect(page.getByRole('button', { name: 'Log practice' })).toBeVisible();
  });

  test('B6.3 past sessions have no Remove button', async ({ page }) => {
    await page.goto('/dashboard/practice');
    await page.waitForLoadState('networkidle');

    // Scope to the History card to avoid matching sidebar li elements
    const historySection = page.locator('[data-slot="card"]', { hasText: /History/ }).first();
    await expect(historySection).toBeVisible({ timeout: 10_000 });

    const pastRow = historySection.locator('li', { hasText: 'E2E past session' }).first();
    await expect(pastRow).toBeVisible({ timeout: 10_000 });
    // canUndo = false for yesterday's session — Remove button must not appear
    await expect(pastRow.getByRole('button', { name: 'Remove' })).not.toBeVisible();
  });

  test('B6.1 log a practice session', async ({ page }) => {
    await page.goto('/dashboard/practice');
    await page.waitForLoadState('networkidle');

    // Select duration preset
    await page.locator('button:has-text("15m")').click();
    // Add notes
    await page.locator('textarea#practice-notes').fill('E2E log test session');
    // Submit
    await page.getByRole('button', { name: 'Log practice' }).click();
    // Success toast
    await expect(page.locator('text=/Practice logged/i').first()).toBeVisible({ timeout: 10_000 });
  });

  test('B6.2 delete same-day entry (undo)', async ({ page }) => {
    await page.goto('/dashboard/practice');
    await page.waitForLoadState('networkidle');

    // Log a fresh session
    await page.locator('button:has-text("10m")').click();
    await page.locator('textarea#practice-notes').fill('E2E undo test session');
    await page.getByRole('button', { name: 'Log practice' }).click();
    await expect(page.locator('text=/Practice logged/i').first()).toBeVisible({ timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    // Scope to History card and find the newly logged session
    const historySection = page.locator('[data-slot="card"]', { hasText: /History/ }).first();
    const newRow = historySection.locator('li', { hasText: 'E2E undo test session' }).first();
    const removeBtn = newRow.getByRole('button', { name: 'Remove' });
    await expect(removeBtn).toBeVisible({ timeout: 8_000 });
    await removeBtn.click();
    await expect(page.locator('text=/Practice session removed/i').first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
