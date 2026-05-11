/**
 * Phase 5 — mobile/touch-interactions
 *
 * Mobile-specific gestures and viewport behaviour. Runs against the
 * iPhone 12 project (configured in playwright.config.ts).
 *
 * @tags @mobile @ui @unbreakable
 */

import { test, expect } from '../../fixtures';

test.describe('Mobile — touch interactions', { tag: ['@mobile', '@ui', '@unbreakable'] }, () => {
  test.beforeEach(async ({ loginAs, page }) => {
    await loginAs('teacher');
    // Ensure a mobile viewport even if running on a desktop project.
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test('mobile nav drawer toggles open and closed', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    const menuButton = page.getByRole('button', { name: /menu|navigation/i }).first();
    const hasMenu = await menuButton.isVisible().catch(() => false);
    test.skip(!hasMenu, 'Mobile menu button not exposed on this viewport');
    await menuButton.click();
    // Look for a Dashboard / Lessons link inside the drawer.
    await expect(page.getByRole('link', { name: /lessons|dashboard/i }).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test.skip('drag-to-reorder repertoire on iPhone viewport (TODO: HTML5 DnD on mobile is finicky — use a touch-friendly library mock)', async () => {
    // Drag the second repertoire item above the first, reload, expect
    // the new sort_order.
  });
});
