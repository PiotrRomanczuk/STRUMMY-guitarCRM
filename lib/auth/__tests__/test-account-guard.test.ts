import {
  guardTestAccountMutation,
  assertNotTestAccount,
  isDemoMutationBlocked,
  TEST_ACCOUNT_MUTATION_ERROR,
} from '../test-account-guard';

describe('guardTestAccountMutation', () => {
  it('returns error object when isDevelopment is true', () => {
    const result = guardTestAccountMutation(true);
    expect(result).toEqual({
      success: false,
      error: TEST_ACCOUNT_MUTATION_ERROR,
    });
  });

  it('returns null when isDevelopment is false', () => {
    const result = guardTestAccountMutation(false);
    expect(result).toBeNull();
  });
});

describe('assertNotTestAccount', () => {
  it('throws Error with correct message when isDevelopment is true', () => {
    expect(() => assertNotTestAccount(true)).toThrow(TEST_ACCOUNT_MUTATION_ERROR);
  });

  it('does not throw when isDevelopment is false', () => {
    expect(() => assertNotTestAccount(false)).not.toThrow();
  });
});

describe('DEMO_WRITES_ENABLED', () => {
  const original = process.env.DEMO_WRITES_ENABLED;

  afterEach(() => {
    if (original === undefined) delete process.env.DEMO_WRITES_ENABLED;
    else process.env.DEMO_WRITES_ENABLED = original;
  });

  it('blocks demo accounts when unset', () => {
    delete process.env.DEMO_WRITES_ENABLED;
    expect(isDemoMutationBlocked(true)).toBe(true);
    expect(guardTestAccountMutation(true)).not.toBeNull();
    expect(() => assertNotTestAccount(true)).toThrow();
  });

  it('lets demo accounts write when set to "true"', () => {
    process.env.DEMO_WRITES_ENABLED = 'true';
    expect(isDemoMutationBlocked(true)).toBe(false);
    expect(guardTestAccountMutation(true)).toBeNull();
    expect(() => assertNotTestAccount(true)).not.toThrow();
  });

  it('only accepts the exact string "true"', () => {
    for (const value of ['1', 'yes', 'TRUE', '']) {
      process.env.DEMO_WRITES_ENABLED = value;
      expect(isDemoMutationBlocked(true)).toBe(true);
    }
  });

  it('never affects non-demo accounts', () => {
    for (const value of ['true', 'false']) {
      process.env.DEMO_WRITES_ENABLED = value;
      expect(isDemoMutationBlocked(false)).toBe(false);
    }
  });
});
