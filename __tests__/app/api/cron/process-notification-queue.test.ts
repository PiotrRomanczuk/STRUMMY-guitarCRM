/**
 * Regression tests for GET /api/cron/process-notification-queue.
 *
 * Guards auth gating, the happy path (forwards queue + retry stats and
 * runs the auth rate-limit cleanup), and graceful degradation when the
 * underlying queue processor throws.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/process-notification-queue/route';

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

jest.mock('@/lib/services/notification-queue-processor', () => ({
  processQueuedNotifications: jest.fn(),
  retryFailedNotifications: jest.fn(),
}));

jest.mock('@/lib/auth/rate-limiter', () => ({
  cleanupExpiredAuthEntries: jest.fn(),
}));

import {
  processQueuedNotifications,
  retryFailedNotifications,
} from '@/lib/services/notification-queue-processor';
import { cleanupExpiredAuthEntries } from '@/lib/auth/rate-limiter';

const CRON_SECRET = 'test-cron-secret';

function makeRequest(): Request {
  return new NextRequest('http://localhost/api/cron/process-notification-queue', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

describe('GET /api/cron/process-notification-queue', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 401 without a valid cron secret', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/process-notification-queue'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with combined queue + retry stats on success', async () => {
    (processQueuedNotifications as jest.Mock).mockResolvedValue({ processed: 10, failed: 1 });
    (retryFailedNotifications as jest.Mock).mockResolvedValue({
      retried: 3,
      failed: 1,
      deadLettered: 0,
    });
    (cleanupExpiredAuthEntries as jest.Mock).mockResolvedValue(undefined);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.queue).toEqual({ processed: 10, failed: 1 });
    expect(body.retry).toEqual({ retried: 3, failed: 1, deadLettered: 0 });
    expect(processQueuedNotifications).toHaveBeenCalledWith(100);
    expect(cleanupExpiredAuthEntries).toHaveBeenCalledTimes(1);
  });

  it('returns 200 (not 500) when processQueuedNotifications throws', async () => {
    (processQueuedNotifications as jest.Mock).mockRejectedValue(new Error('queue DB down'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Internal Server Error');
    // Subsequent steps should not run once processing throws
    expect(retryFailedNotifications).not.toHaveBeenCalled();
  });
});
