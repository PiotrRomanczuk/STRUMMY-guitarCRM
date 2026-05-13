import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

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

  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/.claude/worktrees/'],

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
