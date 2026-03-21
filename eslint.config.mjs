import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Project-specific ignores
    'supabase/**',
    'coverage/**',
    // Script files with different module system
    'scripts/**/*.js',
    '*.js',
    // History/backup files
    'scripts/history/**',
    // Test infrastructure dirs
    'tests/**',
    'cypress/**',
    // Claude Code agent worktrees (isolated copies for parallel agents)
    '.claude/**',
  ]),
  // Fix: eslint-plugin-react (bundled by eslint-config-next) uses context.getFilename()
  // which was removed in ESLint 10. Pinning react.version bypasses auto-detection.
  {
    name: 'project/react-version-fix',
    settings: {
      react: { version: '19.0.0' },
    },
  },
  // Allow _-prefixed identifiers to be unused (intentional no-ops)
  {
    name: 'project/underscore-ignore-pattern',
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Project-wide rules and overrides
  {
    name: 'project/component-size-rules',
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
    rules: {
      // Enforce small, focused files (warn — many files still exceed this)
      'max-lines': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true, IIFEs: true }],
      complexity: ['warn', { max: 50 }],
      'max-depth': ['warn', 10],
      // Discourage explicit 'any' — prefer unknown or proper types
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Do not apply size rules to generated types, migrations, or tests
  {
    name: 'project/size-rules-exceptions',
    files: ['types/**/*.ts', 'supabase/**/*.{ts,sql}', '__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      'max-lines': 'off',
      'max-lines-per-function': 'off',
    },
  },
]);

export default eslintConfig;
