/* eslint-disable @typescript-eslint/no-require-imports, react-hooks/rules-of-hooks */
import { test as base, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Authentication Fixture
 *
 * Provides session-cached authentication for fast test execution.
 * Sessions are saved to .auth/{role}.json files and reused across tests.
 *
 * Based on Playwright's recommended authentication pattern:
 * https://playwright.dev/docs/auth
 */

type Role = 'admin' | 'teacher' | 'student';

interface AuthCredentials {
  email: string;
  password: string;
}

interface AuthFixtures {
  loginAs: (role: Role) => Promise<void>;
  logout: () => Promise<void>;
}

// Test credentials from environment
const credentials: Record<Role, AuthCredentials> = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'p.romanczuk@gmail.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'test123_admin',
  },
  teacher: {
    email: process.env.TEST_TEACHER_EMAIL || 'teacher@example.com',
    password: process.env.TEST_TEACHER_PASSWORD || 'test123_teacher',
  },
  student: {
    email: process.env.TEST_STUDENT_EMAIL || 'student@example.com',
    password: process.env.TEST_STUDENT_PASSWORD || 'test123_student',
  },
};

// Session storage paths
const authDir = path.join(__dirname, '..', '.auth');
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}
const getStoragePath = (role: Role) => path.join(authDir, `${role}.json`);

/**
 * Perform login for a specific role and save session state
 */
async function performLogin(page: Page, role: Role): Promise<void> {
  const creds = credentials[role];
  const storagePath = getStoragePath(role);

  // Navigate to sign-in page (use domcontentloaded to avoid slow Turbopack compilation waits)
  await page.goto('/sign-in', { waitUntil: 'domcontentloaded', timeout: 45000 });

  // Wait for form to be visible (handles isChecking state in sign-in page)
  await page.waitForSelector('[data-testid="email"]', { state: 'visible', timeout: 30000 });

  // Fill in credentials using data-testid
  await page.fill('[data-testid="email"]', creds.email);
  await page.fill('[data-testid="password"]', creds.password);

  // Submit form using data-testid
  await page.click('[data-testid="signin-button"]');

  // Wait for successful login redirect (longer timeout for first compilation of dashboard)
  await page.waitForURL(/\/dashboard/, { timeout: 60000, waitUntil: 'domcontentloaded' });

  // Verify we're logged in by checking for main content (use first main element)
  await page.locator('main').first().waitFor({ state: 'visible', timeout: 30000 });

  // Save authenticated state
  await page.context().storageState({ path: storagePath });
}

export const test = base.extend<AuthFixtures>({
  /**
   * Login as a specific role with session caching
   *
   * @param role - The role to log in as (admin, teacher, student)
   *
   * @example
   * test('should view dashboard', async ({ page, loginAs }) => {
   *   await loginAs('teacher');
   *   await page.goto('/dashboard');
   * });
   */
  loginAs: async ({ page }, use) => {
    const loginFn = async (role: Role) => {
      const storagePath = getStoragePath(role);

      // Try to use existing session
      try {
        await page
          .context()
          .addCookies(JSON.parse(require('fs').readFileSync(storagePath, 'utf-8')).cookies);

        // Verify the session is still valid. We must check the URL, NOT just that
        // a <main> element is visible: an expired session redirects /dashboard →
        // /sign-in, and the sign-in page ALSO renders a <main>, so a visibility
        // check silently accepts a logged-out session and every test then fails
        // on the sign-in page. A still-authenticated session stays on /dashboard.
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.locator('main').first().waitFor({ state: 'visible', timeout: 10000 });

        const onDashboard = new URL(page.url()).pathname.startsWith('/dashboard');
        if (onDashboard) {
          // Session is valid, reuse it
          return;
        }
      } catch {
        // Session file doesn't exist or is invalid, perform fresh login
      }

      // Perform fresh login
      await performLogin(page, role);
    };

    await use(loginFn);
  },

  /**
   * Logout from current session
   *
   * @example
   * test('should logout', async ({ page, logout }) => {
   *   await logout();
   * });
   */
  logout: async ({ page }, use) => {
    const logoutFn = async () => {
      // Click user menu
      await page.click('[data-testid="user-menu"]');

      // Click logout button
      await page.click('[data-testid="logout-button"]');

      // Wait for redirect away from dashboard
      await page.waitForURL((url) => !url.pathname.includes('/dashboard'), {
        timeout: 10000,
      });
    };

    await use(logoutFn);
  },
});

export { expect } from '@playwright/test';
