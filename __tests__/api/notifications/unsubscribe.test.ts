/**
 * Tests for the HMAC-signed unsubscribe endpoint and token utility.
 *
 * Covers:
 * - Valid token → 307 redirect to success page
 * - Tampered token → 401
 * - Expired token (>30 days) → 401
 * - Missing token → 400
 * - Legacy userId+type params (no token) → 400 with migration message
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/notifications/unsubscribe/route';
import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
} from '@/lib/notifications/unsubscribe-token';

const TEST_SECRET = 'test-secret-for-unsubscribe-hmac';
const MOCK_USER_ID = 'user-00000000-0000-0000-0000-000000000001';
const MOCK_TYPE = 'lesson_reminder_24h';

// Patch NextResponse.redirect onto the global mock (jest.setup.js doesn't include it)
beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { NextResponse } = require('next/server');
  if (!NextResponse.redirect) {
    NextResponse.redirect = (url: URL | string) => {
      const location = url instanceof URL ? url.toString() : url;
      return {
        status: 307,
        headers: new Headers({ location }),
      };
    };
  }
});

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() =>
              Promise.resolve({
                data: { id: MOCK_USER_ID, email: 'test@example.com' },
                error: null,
              })
            ),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      })),
    })
  ),
}));

describe('Unsubscribe token utility', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV, UNSUBSCRIBE_TOKEN_SECRET: TEST_SECRET };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('generates a token that round-trips through verify', () => {
    const token = generateUnsubscribeToken(MOCK_USER_ID, MOCK_TYPE);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const result = verifyUnsubscribeToken(token);
    expect(result).toEqual({ userId: MOCK_USER_ID, type: MOCK_TYPE });
  });

  it('rejects a token with a tampered payload', () => {
    const token = generateUnsubscribeToken(MOCK_USER_ID, MOCK_TYPE);
    const parts = token.split('~');
    parts[1] = parts[1].slice(0, -1) + 'X';
    const tampered = parts.join('~');
    expect(verifyUnsubscribeToken(tampered)).toBeNull();
  });

  it('rejects a token with a tampered HMAC', () => {
    const token = generateUnsubscribeToken(MOCK_USER_ID, MOCK_TYPE);
    const parts = token.split('~');
    // Change a character in the MIDDLE of the encoded HMAC (not the last char,
    // which may be a base64 padding byte that doesn't affect decoded value)
    const mid = Math.floor(parts[0].length / 2);
    const original = parts[0][mid];
    const replacement = original === 'A' ? 'B' : 'A';
    parts[0] = parts[0].slice(0, mid) + replacement + parts[0].slice(mid + 1);
    const tampered = parts.join('~');
    expect(verifyUnsubscribeToken(tampered)).toBeNull();
  });

  it('rejects a token older than 30 days', () => {
    const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    jest.spyOn(Date, 'now').mockReturnValueOnce(thirtyOneDaysAgo);
    const token = generateUnsubscribeToken(MOCK_USER_ID, MOCK_TYPE);
    jest.spyOn(Date, 'now').mockRestore();
    expect(verifyUnsubscribeToken(token)).toBeNull();
  });

  it('rejects tokens when secret is missing', () => {
    process.env.UNSUBSCRIBE_TOKEN_SECRET = '';
    expect(verifyUnsubscribeToken('anything')).toBeNull();
  });

  it('throws on generate when secret is missing', () => {
    process.env.UNSUBSCRIBE_TOKEN_SECRET = '';
    expect(() => generateUnsubscribeToken(MOCK_USER_ID, MOCK_TYPE)).toThrow();
  });

  it('rejects tokens with wrong number of parts', () => {
    expect(verifyUnsubscribeToken('onlyone')).toBeNull();
    expect(verifyUnsubscribeToken('a~b~c')).toBeNull();
    expect(verifyUnsubscribeToken('a~b~c~d~e')).toBeNull();
  });
});

describe('GET /api/notifications/unsubscribe', () => {
  const OLD_ENV = process.env;
  const BASE_URL = 'http://localhost:3000';

  beforeEach(() => {
    process.env = { ...OLD_ENV, UNSUBSCRIBE_TOKEN_SECRET: TEST_SECRET };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('redirects to success page with a valid token', async () => {
    const token = generateUnsubscribeToken(MOCK_USER_ID, MOCK_TYPE);
    const request = new NextRequest(
      `${BASE_URL}/api/notifications/unsubscribe?token=${encodeURIComponent(token)}`
    );

    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('/unsubscribe');
    expect(location).toContain('success=true');
    expect(location).toContain(`type=${MOCK_TYPE}`);
  });

  it('returns 401 for a tampered token', async () => {
    const token = generateUnsubscribeToken(MOCK_USER_ID, MOCK_TYPE);
    const parts = token.split('~');
    parts[1] = parts[1].slice(0, -1) + 'Z';
    const tampered = parts.join('~');

    const request = new NextRequest(
      `${BASE_URL}/api/notifications/unsubscribe?token=${encodeURIComponent(tampered)}`
    );
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('invalid_token');
  });

  it('returns 401 for an expired token', async () => {
    const thirtyOneDaysAgo = Date.now() - 31 * 24 * 60 * 60 * 1000;
    jest.spyOn(Date, 'now').mockReturnValueOnce(thirtyOneDaysAgo);
    const token = generateUnsubscribeToken(MOCK_USER_ID, MOCK_TYPE);
    jest.spyOn(Date, 'now').mockRestore();

    const request = new NextRequest(
      `${BASE_URL}/api/notifications/unsubscribe?token=${encodeURIComponent(token)}`
    );
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('invalid_token');
  });

  it('returns 400 when token is missing entirely', async () => {
    const request = new NextRequest(`${BASE_URL}/api/notifications/unsubscribe`);
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('missing_token');
  });

  it('returns 400 with migration message for legacy userId+type params', async () => {
    const request = new NextRequest(
      `${BASE_URL}/api/notifications/unsubscribe?userId=${MOCK_USER_ID}&type=${MOCK_TYPE}`
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('legacy_params');
    expect(body.message).toContain('outdated');
  });
});
