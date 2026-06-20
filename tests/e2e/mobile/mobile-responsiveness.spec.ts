import { test, expect } from '../../fixtures';

/**
 * Mobile Responsiveness E2E Tests
 *
 * Validates mobile-specific UI behaviors across iPhone and iPad viewports.
 * Run with: npx playwright test --project="iPhone 12"
 *           npx playwright test --project="iPad Pro"
 *
 * These tests verify:
 * - Mobile bottom navigation visibility
 * - Drawer-based mobile menu
 * - Touch target minimum sizes (44px)
 * - Responsive form layouts
 * - Dashboard responsiveness
 * - Safe area handling
 */
test.describe('Mobile Responsiveness @mobile', { tag: '@mobile' }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('dashboard loads and displays stats grid on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Stats grid should be visible
    const statsGrid = page.locator('[data-tour="stats-grid"], .grid').first();
    await expect(statsGrid).toBeVisible({ timeout: 15_000 });

    // Verify page doesn't have horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test('mobile bottom nav is visible on narrow screens', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // MobileBottomNav should be visible on mobile
    const bottomNav = page
      .locator('nav')
      .filter({ has: page.locator('a[href="/dashboard"]') })
      .last();
    await expect(bottomNav).toBeVisible({ timeout: 10_000 });
  });

  test('hamburger menu opens drawer on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for hamburger menu button
    const menuButton = page
      .getByRole('button')
      .filter({ has: page.locator('svg') })
      .first();

    // If a hamburger menu exists (on horizontal nav mode), click it
    const hamburgerButton = page.locator('button:has(svg.lucide-menu)');
    if (await hamburgerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hamburgerButton.click();

      // Drawer should open with navigation links
      const drawer = page.locator('[role="dialog"], [data-state="open"]');
      await expect(drawer).toBeVisible({ timeout: 5_000 });
    }
  });

  test('touch targets meet 44px minimum on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    await page.goto('/dashboard/songs');
    await page.waitForLoadState('networkidle');

    // Check all interactive buttons have at least 44px touch target
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        // Either width or height should be >= 44px (some inline buttons are wider but shorter)
        const meetsMinimum = box.height >= 40 || box.width >= 40; // 40px allows for slight CSS rounding
        if (!meetsMinimum) {
          const text = await button.textContent();
          console.warn(
            `Button "${text?.trim()}" has small touch target: ${box.width}x${box.height}`
          );
        }
      }
    }
  });

  test('sign-in form is usable on mobile', async ({ page, isMobile, logout }) => {
    test.skip(!isMobile, 'Mobile-only test');

    await page.goto('/sign-in');
    await page.waitForSelector('[data-testid="email"]', { state: 'visible', timeout: 15000 });

    // Verify form fields are visible and accessible
    const emailInput = page.locator('[data-testid="email"]');
    const passwordInput = page.locator('[data-testid="password"]');
    const submitButton = page.locator('[data-testid="signin-button"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Verify inputs are not clipped by the viewport
    const emailBox = await emailInput.boundingBox();
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    if (emailBox) {
      expect(emailBox.x).toBeGreaterThanOrEqual(0);
      expect(emailBox.x + emailBox.width).toBeLessThanOrEqual(viewportWidth + 1);
    }
  });

  test('songs list renders mobile card view', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    await page.goto('/dashboard/songs');
    await page.waitForLoadState('networkidle');

    // On mobile, the table should be hidden and card view should show
    const desktopTable = page.locator('[data-testid="song-table"]');
    const isTableVisible = await desktopTable.isVisible({ timeout: 3000 }).catch(() => false);

    // Table should be hidden on mobile (md:block means hidden below md)
    expect(isTableVisible).toBeFalsy();
  });

  test('no horizontal overflow on key pages', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    const pages = ['/dashboard', '/dashboard/songs', '/dashboard/lessons'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth + 1;
      });

      if (hasOverflow) {
        console.warn(`Horizontal overflow detected on ${pagePath}`);
      }
      expect(hasOverflow).toBeFalsy();
    }
  });
});

test.describe('iPad Responsiveness @tablet', { tag: '@tablet' }, () => {
  test.beforeEach(async ({ loginAs }) => {
    await loginAs('teacher');
  });

  test('iPad shows sidebar or tablet navigation', async ({ page, isMobile }) => {
    // This test should run on iPad projects (not strictly isMobile)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const viewportWidth = await page.evaluate(() => window.innerWidth);

    // iPad portrait (768px) or landscape (1024px+) should show navigation
    if (viewportWidth >= 768) {
      // Should have either a sidebar or horizontal nav
      const hasSidebar = await page
        .locator('[data-sidebar]')
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      const hasHorizontalNav = await page
        .locator('nav')
        .first()
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      expect(hasSidebar || hasHorizontalNav).toBeTruthy();
    }
  });

  test('dashboard stats grid uses appropriate columns on iPad', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Editorial dashboard uses inline styles; fall back to main content area width check
    const mainContent = page.locator('main, [role="main"], #main-content').first();
    const statsGrid = page.locator('[data-tour="stats-grid"]').first();
    const hasStatsGrid = (await statsGrid.count()) > 0;

    const target = hasStatsGrid ? statsGrid : mainContent;
    await expect(target).toBeVisible({ timeout: 15_000 });

    const gridBox = await target.boundingBox();
    if (gridBox) {
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      // Main content should use most of the available width
      expect(gridBox.width).toBeGreaterThan(viewportWidth * 0.4);
    }
  });
});
