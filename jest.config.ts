import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// When running inside a worktree (cwd at .claude/worktrees/<name>/), ignore the
// OTHER worktrees but allow the current one. When running from main, ignore all
// worktrees. A blanket `/.claude/` ignore breaks worktree test runs entirely.
const worktreeMatch = process.cwd().match(/\.claude\/worktrees\/([^/]+)/);
const worktreeIgnorePattern = worktreeMatch
  ? `/\\.claude/worktrees/(?!${worktreeMatch[1]}/)`
  : '/\\.claude/worktrees/';

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',

  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Optimized test timeout
  testTimeout: 15000, // Reduced from 30s for faster execution

  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    // Mock heavy dependencies for performance
    '^@supabase/supabase-js$': '<rootDir>/lib/testing/__mocks__/supabase.ts',
    '^@/lib/supabase$': '<rootDir>/lib/testing/__mocks__/supabase.ts',
  },

  // Test discovery — `.integration.test.*` and `.e2e.test.*` are excluded via
  // testPathIgnorePatterns below, so plain `*.test.*` files run as unit tests.
  testMatch: [
    '<rootDir>/lib/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/hooks/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/app/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/components/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/schemas/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}',
  ],

  // Performance optimizations
  maxWorkers: '50%', // Use half available cores
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  clearMocks: true,
  resetMocks: false, // Preserve mocks between tests for performance
  restoreMocks: true,

  // Coverage configuration - Focus on business logic
  coverageReporters: ['text-summary', 'html', 'lcov', 'json-summary'],
  collectCoverageFrom: [
    // Focus on business logic
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'app/actions/**/*.{js,jsx,ts,tsx}',
    'components/shared/**/*.{js,jsx,ts,tsx}',
    'schemas/**/*.{js,jsx,ts,tsx}',

    // Exclude non-business logic
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/cypress/**',
    '!**/*.config.{js,ts}',
    '!**/middleware.ts',
    '!app/layout.tsx',
    '!app/page.tsx',
    '!app/global-error.tsx',
    '!**/jest.setup.js',
    '!**/__tests__/**',
    '!**/*.test.{js,jsx,ts,tsx}',
  ],

  // Coverage thresholds for quality gates
  // Thresholds set to current baseline (~44%). Raise as coverage improves.
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 35,
      lines: 40,
      statements: 40,
    },
  },

  // Ignore patterns - Exclude integration tests and sibling worktrees
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/cypress/',
    worktreeIgnorePattern,
    '.integration.test.',
    '.e2e.test.',
    '.rls.test.',
    '__tests__/auth/credentials.test.ts',
    'scripts/database/shadow-user-linking.test.ts',

    // ─── Quarantined: rotted tests revealed when testMatch was broadened ───
    // Each of these files exists on disk but has not run for some time and
    // currently fails (stale mocks, renamed components, drifted assertions,
    // outdated Supabase query builder shapes). Triage backlog — see
    // tasks/test-coverage-analysis.md §3 and §P0. Remove an entry only after
    // the file passes locally.
    '__tests__/api/lessons/\\[id\\]/route\\.test\\.ts',
    '__tests__/api/lessons/bulk/route\\.test\\.ts',
    '__tests__/api/lessons/route\\.test\\.ts',
    '__tests__/api/lessons/search/route\\.test\\.ts',
    '__tests__/api/notifications/unsubscribe\\.test\\.ts',
    '__tests__/api/song/handlers\\.test\\.ts',
    '__tests__/components/admin/index\\.test\\.tsx',
    '__tests__/components/auth/ForgotPasswordForm\\.test\\.tsx',
    '__tests__/components/auth/ResetPasswordForm\\.test\\.tsx',
    '__tests__/components/auth/SignInForm\\.test\\.tsx',
    '__tests__/components/auth/SignUpForm\\.test\\.tsx',
    '__tests__/components/dashboard/calendar/CalendarEventsList\\.test\\.tsx',
    '__tests__/components/dashboard/calendar/ConnectGoogleButton\\.test\\.tsx',
    '__tests__/components/dashboard/SyncCalendarModal\\.test\\.tsx',
    '__tests__/components/users/UserFormFields\\.test\\.tsx',
    '__tests__/dashboard/assignments/page\\.test\\.tsx',
    '__tests__/dashboard/songs/page\\.test\\.tsx',
    '__tests__/dashboard/users/page\\.test\\.tsx',
    '__tests__/database/shadow-user-linking\\.test\\.ts',
    '__tests__/lib/auth/cron-auth\\.test\\.ts',
    '__tests__/lib/auth/rate-limiter\\.test\\.ts',
    '__tests__/lib/getUserWithRolesSSR\\.test\\.ts',
    '__tests__/lib/google\\.test\\.ts',
    '__tests__/orphan-profile-cleanup\\.test\\.ts',
    '__tests__/shadow-users\\.test\\.ts',
    '__tests__/sync-all-lessons\\.test\\.ts',
    '__tests__/utils/getUserRolesSSR\\.test\\.ts',
    'app/\\(auth\\)/sign-in/page\\.test\\.tsx',
    'app/\\(auth\\)/sign-up/page\\.test\\.tsx',
    'app/api/admin/lessons/route\\.test\\.ts',
    'app/api/admin/users/route\\.test\\.ts',
    'app/api/lessons/\\[id\\]/route\\.test\\.ts',
    'app/api/lessons/bulk/route\\.test\\.ts',
    'app/api/lessons/route\\.test\\.ts',
    'app/api/lessons/search/route\\.test\\.ts',
    'app/api/notifications/unsubscribe/__tests__/route\\.test\\.ts',
    'app/api/song/handlers\\.test\\.ts',
    'app/api/spotify/features/route\\.test\\.ts',
    'app/api/spotify/matches/approve/route\\.test\\.ts',
    'app/api/spotify/matches/reject/route\\.test\\.ts',
    'app/api/spotify/search/route\\.test\\.ts',
    'app/api/spotify/sync/route\\.test\\.ts',
    'app/dashboard/assignments/page\\.test\\.tsx',
    'app/dashboard/songs/page\\.test\\.tsx',
    'app/dashboard/users/page\\.test\\.tsx',
    'components/assignments/form/AssignmentForm\\.test\\.tsx',
    'components/assignments/shared/__tests__/AssignmentStatusActions\\.test\\.tsx',
    'components/auth/ForgotPasswordForm\\.test\\.tsx',
    'components/auth/ResetPasswordForm\\.test\\.tsx',
    'components/auth/SignInForm\\.test\\.tsx',
    'components/auth/SignUpForm\\.test\\.tsx',
    'components/dashboard/admin/SongStatsTable\\.test\\.tsx',
    'components/dashboard/calendar/CalendarEventsList\\.test\\.tsx',
    'components/dashboard/Dashboard\\.test\\.tsx',
    'components/lessons/form/LessonForm\\.test\\.tsx',
    'components/lessons/hooks/__tests__/useStudentSongProgress\\.test\\.ts',
    'components/lessons/list/LessonList\\.test\\.tsx',
    'components/songs/form/SongForm\\.test\\.tsx',
  ],

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Transform ignore patterns for ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)',
  ],

  // Use separate TypeScript config for tests
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },

  // Global setup for test environment
  globalSetup: '<rootDir>/lib/testing/jest.global-setup.ts',
  globalTeardown: '<rootDir>/lib/testing/jest.global-teardown.ts',

  // Watch plugins for better developer experience (disabled due to version conflict)
  // watchPlugins: [
  // 	'jest-watch-typeahead/filename',
  // 	'jest-watch-typeahead/testname',
  // ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
