/**
 * Regression test for GET /api/cron/weekly-insights (Phase 0.4).
 *
 * Guards the 200-path: the cron must never 500, even when the underlying
 * action reports a partial failure or throws.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/weekly-insights/route';

// Provide a constructable NextResponse (the global jest.setup mock only has .json)
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
import { sendWeeklyInsights } from '@/app/actions/email/send-weekly-insights';

jest.mock('@/app/actions/email/send-weekly-insights', () => ({
  sendWeeklyInsights: jest.fn(),
}));

const CRON_SECRET = 'test-cron-secret';

function makeRequest(): Request {
  return new NextRequest('http://localhost/api/cron/weekly-insights', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

describe('GET /api/cron/weekly-insights', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 200 when emails send successfully', async () => {
    (sendWeeklyInsights as jest.Mock).mockResolvedValue({
      success: true,
      emailsSent: 3,
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.emailsSent).toBe(3);
  });

  it('returns 200 (not 500) when the action reports a partial failure', async () => {
    (sendWeeklyInsights as jest.Mock).mockResolvedValue({
      success: false,
      emailsSent: 1,
      errors: ['teacher@example.com: SMTP timeout'],
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.errors).toHaveLength(1);
  });

  it('returns 200 (not 500) when the action throws', async () => {
    (sendWeeklyInsights as jest.Mock).mockRejectedValue(new Error('boom'));

    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
  });

  it('returns 401 without a valid cron secret', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/weekly-insights'));
    expect(res.status).toBe(401);
  });
});
