import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

// Load test environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Check if local Supabase is running — reads the actual host/port from NEXT_PUBLIC_SUPABASE_LOCAL_URL
// so LAN-hosted stacks (e.g. EliteDesk at 192.168.1.75:54321) are detected correctly.
// Mirrors the same logic in next.config.ts so test helpers use the correct DB.
function isLocalSupabaseRunning(): boolean {
  let host = '127.0.0.1';
  let port = 54321;
  const localUrl = process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL;
  if (localUrl) {
    try {
      const parsed = new URL(localUrl);
      host = parsed.hostname;
      port = parsed.port ? Number(parsed.port) : 54321;
    } catch {
      // Fall back to defaults on unparseable URL
    }
  }
  try {
    execSync(`nc -z ${host} ${port} 2>/dev/null`, { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

if (process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL && !isLocalSupabaseRunning()) {
  console.log(`[Playwright] Local Supabase not detected, using REMOTE configuration`);
  delete process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY;
  delete process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY;
  delete process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL;
}

// Load test credentials
const testCredentials = {
  TEST_ADMIN_EMAIL: 'admin@dev.local',
  TEST_ADMIN_PASSWORD: 'test123_admin',
  TEST_STUDENT_EMAIL: 'student@dev.local',
  TEST_STUDENT_PASSWORD: 'test123_student',
  TEST_TEACHER_EMAIL: 'teacher@dev.local',
  TEST_TEACHER_PASSWORD: 'test123_teacher',
};

// Set environment variables for test access
Object.entries(testCredentials).forEach(([key, value]) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
});

/**
 * Playwright Configuration
 * Matches Cypress settings for seamless migration
 * - Viewport: 1280x720 (default), plus mobile/tablet devices
 * - BaseURL: http://localhost:3000
 * - Timeout: 30000ms (increased for auth flows)
 * - Retries: 2 in CI, 0 locally
 * - Screenshot on failure
 *
 * Run tests on specific devices:
 * - npm run playwright:run -- --project="iPhone 12"
 * - npm run playwright:run -- --project="iPad Pro"
 * - npm run playwright:run -- --project="Desktop Chrome"
 *
 * Run on all devices:
 * - npm run playwright:run
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,

  // Global teardown - cleanup test data after all tests
  globalTeardown: './tests/global-teardown.ts',

  // Timeout configuration - increased for auth flows
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },

  // Output configuration
  outputDir: 'test-results',

  // Run tests in parallel for speed
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry configuration (matches Cypress)
  retries: process.env.CI ? 2 : 0,

  // Limit local workers to 2 — the single Next.js dev server gets overwhelmed by
  // more than 2 concurrent workers running long journey tests.
  workers: process.env.CI ? '50%' : 2,

  // Reporter configuration
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // Screenshot and video on failure
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Viewport size matching Cypress
    viewport: { width: 1280, height: 720 },

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Action timeout
    actionTimeout: 15 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for different browsers and devices
  projects: [
    // Desktop browsers
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Desktop Safari',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
      },
    },

    // Mobile devices
    {
      name: 'iPhone 12',
      use: {
        ...devices['iPhone 12'],
      },
    },
    {
      name: 'iPhone 15 Pro Max',
      use: {
        ...devices['iPhone 15 Pro Max'],
      },
    },

    // Tablet
    {
      name: 'iPad Pro',
      use: {
        ...devices['iPad Pro'],
      },
    },
    {
      name: 'iPad (gen 7)',
      use: {
        ...devices['iPad (gen 7)'],
      },
    },
  ],

  // Web server configuration
  // Start Next.js dev server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
