import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const testCredentials = {
  TEST_ADMIN_EMAIL: 'p.romanczuk@gmail.com',
  TEST_ADMIN_PASSWORD: 'test123_admin',
  TEST_STUDENT_EMAIL: 'student1@example.com',
  TEST_STUDENT_PASSWORD: 'test123_student',
  TEST_TEACHER_EMAIL: 'teacher@example.com',
  TEST_TEACHER_PASSWORD: 'test123_teacher',
};

Object.entries(testCredentials).forEach(([key, value]) => {
  if (!process.env[key]) process.env[key] = value;
});

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts/,
  globalTeardown: './tests/global-teardown.ts',
  timeout: 180 * 1000,
  expect: { timeout: 10 * 1000 },
  outputDir: 'test-results-video',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    viewport: { width: 1440, height: 900 },
    video: 'on',
    screenshot: 'off',
    trace: 'off',
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
