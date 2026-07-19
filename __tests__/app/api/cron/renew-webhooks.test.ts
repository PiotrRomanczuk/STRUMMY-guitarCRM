/**
 * Regression tests for GET /api/cron/renew-webhooks.
 *
 * Guards auth gating, the happy path (forwards renewal + cleanup stats),
 * and graceful degradation when the underlying renewal service throws.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/renew-webhooks/route';

jest.mock('next/server', () => {
  class MockNextResponse {
    body: unknown;
    status: number;
    constructor(body: unknown, init?: { status?: number }) {
      this.body = body;
      this.status = init?.status ?? 200;
    }
    async json() {
      return this.body;
    }
    static json(data: unknown, init?: { status?: number }) {
      return { status: init?.status ?? 200, json: async () => data };
    }
  }
  class MockNextRequest {
    url: string;
    headers: Headers;
    constructor(url: string, init?: { headers?: HeadersInit }) {
      this.url = url;
      this.headers = new Headers(init?.headers);
    }
  }
  return { NextResponse: MockNextResponse, NextRequest: MockNextRequest };
});

jest.mock('@/lib/services/webhook-renewal', () => ({
  renewExpiringWebhooks: jest.fn(),
  cleanupExpiredWebhooks: jest.fn(),
}));

import { renewExpiringWebhooks, cleanupExpiredWebhooks } from '@/lib/services/webhook-renewal';

const CRON_SECRET = 'test-cron-secret';

function makeRequest(): Request {
  return new NextRequest('http://localhost/api/cron/renew-webhooks', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

describe('GET /api/cron/renew-webhooks', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 401 without a valid cron secret', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/renew-webhooks'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with renewal + cleanup summary on success', async () => {
    (renewExpiringWebhooks as jest.Mock).mockResolvedValue({
      totalChecked: 5,
      renewed: 4,
      failed: 1,
      skipped: 0,
      results: [],
    });
    (cleanupExpiredWebhooks as jest.Mock).mockResolvedValue(2);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.renewal).toEqual({ totalChecked: 5, renewed: 4, failed: 1 });
    expect(body.cleanup).toEqual({ deleted: 2 });
  });

  it('returns 200 (not 500) when renewExpiringWebhooks throws', async () => {
    (renewExpiringWebhooks as jest.Mock).mockRejectedValue(new Error('Google API unavailable'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Google API unavailable');
    expect(cleanupExpiredWebhooks).not.toHaveBeenCalled();
  });
});
