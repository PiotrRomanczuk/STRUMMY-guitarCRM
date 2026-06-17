/**
 * Tests for Cron Secret Verification (timing-safe comparison)
 */

import { verifyCronSecret } from '@/lib/auth/cron-auth';

describe('verifyCronSecret', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  function makeRequest(authHeader?: string): Request {
    return {
      headers: {
        get: (name: string) => (name === 'authorization' ? (authHeader ?? null) : null),
      },
    } as unknown as Request;
  }

  it('should return null (authorized) for valid secret', () => {
    process.env.CRON_SECRET = 'my-secret-123';
    const result = verifyCronSecret(makeRequest('Bearer my-secret-123'));
    expect(result).toBeNull();
  });

  it('should return 401 for invalid secret', () => {
    process.env.CRON_SECRET = 'my-secret-123';
    const result = verifyCronSecret(makeRequest('Bearer wrong-secret'));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it('should return 401 for missing authorization header', () => {
    process.env.CRON_SECRET = 'my-secret-123';
    const result = verifyCronSecret(makeRequest());
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it('should return 500 when CRON_SECRET is not configured', () => {
    delete process.env.CRON_SECRET;
    const result = verifyCronSecret(makeRequest('Bearer anything'));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(500);
  });

  it('should return 401 for secret with different length', () => {
    process.env.CRON_SECRET = 'my-secret-123';
    const result = verifyCronSecret(makeRequest('Bearer short'));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });

  it('should return 401 for empty authorization header', () => {
    process.env.CRON_SECRET = 'my-secret-123';
    const result = verifyCronSecret(makeRequest(''));
    expect(result).not.toBeNull();
    expect(result!.status).toBe(401);
  });
});
