import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

/**
 * Jest config for RLS-real integration tests against a live Supabase instance.
 *
 * Crucially, this config DOES NOT mock `@supabase/supabase-js` — every other
 * test setup in this repo aliases it to a mock, which would defeat the
 * purpose of testing RLS policies.
 *
 * Run via: `npm run test:rls`. Suites auto-skip via `describeIfRls` if no
 * service-role key is available (e.g. on contributor machines without local
 * Supabase running).
 */
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  testTimeout: 30_000,

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  testMatch: ['<rootDir>/**/*.rls.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/.claude/worktrees/'],

  maxWorkers: 1,
  clearMocks: true,

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
};

export default createJestConfig(config);
