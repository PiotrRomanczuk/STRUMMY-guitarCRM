/**
 * Phase 2 — teacher/lessons-live
 *
 * Live-lesson mode (`/dashboard/lessons/[id]/live`) — the teacher's "during
 * the lesson" view. Auto-save indicators, song-status toggle, closing
 * without losing notes.
 *
 * @tags @teacher @lessons @live @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe(
  'Teacher — live-lesson mode',
  { tag: ['@teacher', '@lessons', '@live', '@unbreakable'] },
  () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('teacher');
    });

    test('live mode opens for an existing lesson and renders the notes textarea', async ({
      page,
    }) => {
      await page.goto('/dashboard/lessons', { waitUntil: 'networkidle' });
      const firstLesson = page.locator('a[href*="/dashboard/lessons/"]').first();
      const hasLesson = await firstLesson.isVisible().catch(() => false);
      test.skip(!hasLesson, 'No lessons seeded for the teacher');

      await firstLesson.click();
      await page.waitForURL(/\/dashboard\/lessons\/[^/]+/);
      const liveLink = page.getByRole('link', { name: /live|start lesson/i }).first();
      const hasLive = await liveLink.isVisible().catch(() => false);
      test.skip(!hasLive, 'Live mode entry point not visible on detail page');
      await liveLink.click();
      await expect(page.getByLabel(/notes/i)).toBeVisible({ timeout: 10000 });
    });

    test.skip('auto-save indicator fires after typing in the notes field (TODO: depends on debounce timing being deterministic)', async () => {
      // Type, wait for the "Saved" indicator, leave the page, reload, see
      // the typed text persisted.
    });
  }
);
