import { test, expect } from '@playwright/test';

/**
 * Critical Path Smoke Tests
 * These tests verify that core functionality is working
 * Should run in <30 seconds and catch major failures quickly
 */
test.describe('🔍 Smoke Tests - Critical Path Verification', { tag: '@smoke' }, () => {
  test.beforeEach(async ({ context }) => {
    // Clear cookies and storage before each test
    await context.clearCookies();
    await context.clearPermissions();
  });

  test('should load the application successfully', async ({ page }) => {
    await page.goto('/');

    // Check body is visible
    await expect(page.locator('body')).toBeVisible();

    // Check HTML lang attribute
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('en');

    // Check for essential page elements
    const hasMain = await page.locator('main, [role="main"], #__next').count();
    expect(hasMain).toBeGreaterThan(0);
  });

  test('should have working authentication system', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'networkidle' });

    // Wait for the page to fully load (handles isChecking state)
    await page.waitForSelector('form', { timeout: 15000 });

    // Verify auth form exists
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('[data-testid="email"]')).toBeVisible();
    await expect(page.locator('[data-testid="password"]')).toBeVisible();
    await expect(page.locator('[data-testid="signin-button"]')).toBeVisible();
  });

  test('should have protected dashboard route', async ({ page }) => {
    // Attempt to access protected route without authentication
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for any redirects to complete
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    const currentUrl = page.url();

    const isRedirected =
      currentUrl.includes('/sign-in') ||
      currentUrl.includes('/login') ||
      currentUrl === new URL('/', page.url()).href;

    expect(isRedirected).toBeTruthy();
  });

  test('should have working navigation system', async ({ page }) => {
    await page.goto('/');

    // The homepage must contain at least one link that users can interact with.
    // This covers both the landing page (sign-in / sign-up links) and authenticated
    // pages (dashboard, students, lessons, songs nav items).
    const linkCount = await page.locator('a[href]').count();
    expect(linkCount).toBeGreaterThan(0);

    // At least one of the known navigation targets should be present as a link
    const knownTargets = ['sign-in', 'sign-up', 'dashboard', 'students', 'lessons', 'songs'];
    let foundTargetCount = 0;
    for (const target of knownTargets) {
      const count = await page.locator(`a[href*="${target}"]`).count();
      if (count > 0) foundTargetCount++;
    }
    expect(foundTargetCount).toBeGreaterThan(0);
  });

  test('should have working API endpoints', async ({ request, baseURL }) => {
    // Test actual API endpoints that exist in the app
    const endpoints = ['/api/database/status', '/api/lessons', '/api/song'];

    for (const endpoint of endpoints) {
      const response = await request.get(`${baseURL}${endpoint}`, {
        failOnStatusCode: false,
        timeout: 15000,
      });

      // Accept 200 (working) or 401/403 (protected but responding)
      expect([200, 401, 403]).toContain(response.status());
    }
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page', { waitUntil: 'networkidle' });

    // Should show custom 404 or not crash
    await expect(page.locator('body')).toBeVisible();

    // Check that it's properly handled (not showing browser default error)
    const bodyText = await page.locator('html').textContent();
    expect(bodyText).not.toContain("This site can't be reached");
  });

  test('should have responsive design basics', async ({ page }) => {
    await page.goto('/');

    // Identify a meaningful element to check at each viewport.
    // The page should have at least a heading or a prominent link.
    const meaningfulLocator = page.locator('h1, h2, a[href*="sign-in"], a[href*="dashboard"], [role="banner"]').first();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await expect(page.locator('body')).toBeVisible();
    await expect(meaningfulLocator).toBeVisible();
    // Content should not overflow horizontally on mobile
    const mobileScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(mobileScrollWidth).toBeLessThanOrEqual(375 + 5); // small tolerance

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await expect(meaningfulLocator).toBeVisible();

    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(meaningfulLocator).toBeVisible();
  });

  test('should not have critical console errors', async ({ page }) => {
    const errors: string[] = [];

    // Known noise from third-party scripts or non-critical sources to ignore
    const ignoredPatterns = [
      /favicon/i,
      /third-party/i,
      /analytics/i,
      /gtag/i,
      /hotjar/i,
      /sentry/i,
      /hydration/i,
      /Download the React DevTools/i,
      /Warning:/,
    ];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const isIgnored = ignoredPatterns.some((pattern) => pattern.test(text));
        if (!isIgnored) {
          errors.push(text);
        }
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Verify the page loads without crashing
    await expect(page.locator('body')).toBeVisible();

    // Fail if there are critical (non-ignored) console errors
    expect(errors).toEqual([]);
  });
});
