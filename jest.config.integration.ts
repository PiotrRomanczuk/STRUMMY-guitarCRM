import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

// When running inside a worktree (cwd at .claude/worktrees/<name>/), ignore the
// OTHER worktrees but allow the current one. When running from main, ignore all
// worktrees. A blanket `/.claude/` ignore breaks worktree test runs entirely.
const worktreeMatch = process.cwd().match(/\.claude\/worktrees\/([^/]+)/);
const worktreeIgnorePattern = worktreeMatch
  ? `/\\.claude/worktrees/(?!${worktreeMatch[1]}/)`
  : '/\\.claude/worktrees/';

/**
 * Jest config for integration tests only.
 * Run via: npm run test:integration
 */
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 15000,

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@supabase/supabase-js$': '<rootDir>/lib/testing/__mocks__/supabase.ts',
    '^@/lib/supabase$': '<rootDir>/lib/testing/__mocks__/supabase.ts',
  },

  testMatch: ['<rootDir>/**/*.integration.test.{ts,tsx}'],

  testPathIgnorePatterns: ['/node_modules/', '/.next/', worktreeIgnorePattern],

  maxWorkers: '50%',
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  transformIgnorePatterns: [
    'node_modules/(?!(node-fetch|data-uri-to-buffer|fetch-blob|formdata-polyfill)/)',
  ],

  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },

  globalSetup: '<rootDir>/lib/testing/jest.global-setup.ts',
  globalTeardown: '<rootDir>/lib/testing/jest.global-teardown.ts',
};

export default createJestConfig(config);
