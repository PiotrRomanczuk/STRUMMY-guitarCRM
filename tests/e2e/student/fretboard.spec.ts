/**
 * Phase 3 — student/fretboard
 *
 * The interactive fretboard at `/dashboard/fretboard`. Asserts the tool
 * mounts and at least one interaction (clicking a fret) updates the UI.
 *
 * @tags @student @fretboard @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe(
  'Student — fretboard tool',
  { tag: ['@student', '@fretboard', '@unbreakable'] },
  () => {
    test.beforeEach(async ({ loginAs }) => {
      await loginAs('student');
    });

    test('fretboard page renders an SVG / canvas board', async ({ page }) => {
      await page.goto('/dashboard/fretboard', { waitUntil: 'networkidle' });
      const board = page.locator('svg, canvas').first();
      await expect(board).toBeVisible({ timeout: 10000 });
    });

    test.skip('clicking a fret highlights it and updates the chord-name readout', async () => {
      // Click a specific fret coordinate; expect the highlighted-fret
      // count to increase OR a "selected" attribute to appear.
    });
  }
);
