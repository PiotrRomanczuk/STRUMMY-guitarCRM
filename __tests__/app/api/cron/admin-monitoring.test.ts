/**
 * Regression tests for GET /api/cron/admin-monitoring.
 *
 * Guards auth gating, the happy path (runs all three health checks every
 * hour, and only sends the daily summary at 8am UTC), and graceful
 * degradation when an individual check throws (others still run).
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/admin-monitoring/route';

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

jest.mock('@/lib/services/notification-monitoring', () => ({
  checkFailureRate: jest.fn(),
  checkBounceRate: jest.fn(),
  checkQueueBacklog: jest.fn(),
  sendDailyAdminSummary: jest.fn(),
}));

import {
  checkFailureRate,
  checkBounceRate,
  checkQueueBacklog,
  sendDailyAdminSummary,
} from '@/lib/services/notification-monitoring';

const CRON_SECRET = 'test-cron-secret';

function makeRequest(): Request {
  return new NextRequest('http://localhost/api/cron/admin-monitoring', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

describe('GET /api/cron/admin-monitoring', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET };
    (checkFailureRate as jest.Mock).mockResolvedValue(undefined);
    (checkBounceRate as jest.Mock).mockResolvedValue(undefined);
    (checkQueueBacklog as jest.Mock).mockResolvedValue(undefined);
    (sendDailyAdminSummary as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 401 without a valid cron secret', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/admin-monitoring'));
    expect(res.status).toBe(401);
  });

  it('runs all three checks and skips the daily summary outside 8am UTC', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-19T14:00:00Z'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.results.failureCheck).toBe('completed');
    expect(body.results.bounceCheck).toBe('completed');
    expect(body.results.queueCheck).toBe('completed');
    expect(body.results.dailySummary).toBe('skipped');
    expect(sendDailyAdminSummary).not.toHaveBeenCalled();
  });

  it('sends the daily summary at 8am UTC', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-19T08:00:00Z'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.results.dailySummary).toBe('sent');
    expect(sendDailyAdminSummary).toHaveBeenCalledTimes(1);
  });

  it('marks a failed check without blocking the other checks', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-19T14:00:00Z'));
    (checkBounceRate as jest.Mock).mockRejectedValue(new Error('bounce query failed'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.results.failureCheck).toBe('completed');
    expect(body.results.bounceCheck).toBe('failed');
    expect(body.results.queueCheck).toBe('completed');
    expect(checkQueueBacklog).toHaveBeenCalledTimes(1);
  });
});
