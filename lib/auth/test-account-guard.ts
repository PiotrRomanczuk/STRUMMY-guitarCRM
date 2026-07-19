export const TEST_ACCOUNT_MUTATION_ERROR = 'This action is not available on test accounts';

/**
 * Demo/test accounts (`profiles.is_development`) are blocked from mutating by
 * default so shared seeded data stays intact.
 *
 * Setting `DEMO_WRITES_ENABLED=true` lifts that block, which is what the public
 * demo deployment runs with: a recruiter following the demo link needs create
 * and edit flows to actually work, and the demo seed
 * (`npm run seed:demo`) is idempotent, so re-running it is the reset.
 *
 * Unset/false everywhere else — local dev and CI keep the guard, so the
 * demo-mutation-guard E2E suite still exercises the blocked path.
 */
export function areDemoWritesEnabled(): boolean {
  return process.env.DEMO_WRITES_ENABLED === 'true';
}

/**
 * True when this account's mutation should be blocked. API routes that return
 * their own 403 should branch on this rather than on `isDevelopment` directly,
 * otherwise they ignore DEMO_WRITES_ENABLED.
 */
export function isDemoMutationBlocked(isDevelopment: boolean): boolean {
  return isDevelopment && !areDemoWritesEnabled();
}

/** For server actions that return `{ success, error }` */
export function guardTestAccountMutation(isDevelopment: boolean) {
  if (isDemoMutationBlocked(isDevelopment))
    return { success: false as const, error: TEST_ACCOUNT_MUTATION_ERROR };
  return null;
}

/** For server actions that throw on error */
export function assertNotTestAccount(isDevelopment: boolean) {
  if (isDemoMutationBlocked(isDevelopment)) throw new Error(TEST_ACCOUNT_MUTATION_ERROR);
}
