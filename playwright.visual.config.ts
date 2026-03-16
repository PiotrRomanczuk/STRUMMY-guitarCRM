import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * Local-only Playwright config for v2 visual regression tests.
 *
 * - NOT run in CI (no matching testMatch in main config)
 * - Always captures screenshots + video
 * - Covers mobile (390px), tablet (768px), desktop (1440px)
 *
 * Usage:
 *   npx playwright test --config playwright.visual.config.ts
 *   npx playwright test --config playwright.visual.config.ts --project="Mobile"
 *   npx playwright test --config playwright.visual.config.ts tests/v2-visual/admin-journey.spec.ts
 */
export default defineConfig({
  testDir: './tests/v2-visual',
  testMatch: /.*\.spec\.ts/,

  timeout: 60_000,
  expect: { timeout: 10_000 },

  outputDir: 'test-results/v2-visual',
  fullyParallel: false, // sequential for stable screenshots
  retries: 0,
  workers: 1,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report/v2-visual' }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'Mobile',
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
