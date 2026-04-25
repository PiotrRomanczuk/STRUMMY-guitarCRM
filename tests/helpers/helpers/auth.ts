import { Page, APIRequestContext } from '@playwright/test';

export interface TestCredentials {
  email: string;
  password: string;
}

// Local dev seed credentials — documented in CLAUDE.md under "Dev Credentials (Local Only)".
// Override via env vars for CI. Never use these against production.
export const TEST_CREDENTIALS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@strummy.local',
    password: process.env.TEST_ADMIN_PASSWORD || 'test123_admin',
  },
  teacher: {
    email: process.env.TEST_TEACHER_EMAIL || 'sarah@strummy.app',
    password: process.env.TEST_TEACHER_PASSWORD || 'Demo2024!',
  },
  student: {
    email: process.env.TEST_STUDENT_EMAIL || 'emma@strummy.app',
    password: process.env.TEST_STUDENT_PASSWORD || 'Demo2024!',
  },
} as const;

/**
 * Login helper for Playwright tests
 * Navigates to sign-in page and logs in with provided credentials
 */
export async function login(page: Page, credentials: TestCredentials): Promise<void> {
  await page.goto('/sign-in', { waitUntil: 'networkidle', timeout: 30000 });

  // Wait for the form to be visible (handles isChecking state)
  await page.waitForSelector('form', { timeout: 30000 });

  // Fill in the login form using data-testid
  await page.locator('[data-testid="email"]').fill(credentials.email);
  await page.locator('[data-testid="password"]').fill(credentials.password);

  // Click sign-in and wait for navigation
  await Promise.all([
    page.waitForURL('**/dashboard**', { timeout: 30000 }),
    page.locator('[data-testid="signin-button"]').click(),
  ]);

  // Verify we're on the dashboard
  await page.waitForLoadState('networkidle', { timeout: 30000 });
}

/**
 * Login as admin
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await login(page, TEST_CREDENTIALS.admin);
}

/**
 * Login as teacher
 */
export async function loginAsTeacher(page: Page): Promise<void> {
  await login(page, TEST_CREDENTIALS.teacher);
}

/**
 * Login as student
 */
export async function loginAsStudent(page: Page): Promise<void> {
  await login(page, TEST_CREDENTIALS.student);
}

/**
 * Get authenticated request context
 * Useful for API testing with authentication
 */
export async function getAuthenticatedContext(
  page: Page,
  credentials: TestCredentials
): Promise<void> {
  await login(page, credentials);
}
