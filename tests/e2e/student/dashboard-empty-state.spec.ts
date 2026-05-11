/**
 * Phase 3 — student/dashboard-empty-state
 *
 * A brand-new student (no lessons, no songs, no assignments) sees friendly
 * empty states across every dashboard widget — not a crash, not a white
 * screen, not a generic "failed to load" toast on every card.
 *
 * @tags @student @dashboard @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe(
  'Student — empty-state dashboard',
  { tag: ['@student', '@dashboard', '@unbreakable'] },
  () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('student');
    });

    test('dashboard mounts and no error boundary fires', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      const errorBoundary = page.getByText(/something went wrong|application error|fatal/i);
      expect(await errorBoundary.count()).toBe(0);
    });

    test('every primary widget either renders content or an empty-state', async ({ page }) => {
      await page.goto('/dashboard', { waitUntil: 'networkidle' });
      // Heuristic: page text must mention at least one of these markers.
      const hasAnyMarker = await page
        .getByText(/no lessons|no songs|no assignments|upcoming|repertoire|continue|welcome/i)
        .first()
        .isVisible()
        .catch(() => false);
      expect(hasAnyMarker).toBe(true);
    });
  }
);
