/**
 * Regression tests for GET /api/cron/update-student-status.
 *
 * Trivial route (41 lines): verifies auth gating and that the route
 * forwards the result of updateStudentActivityStatus() without ever
 * 500-ing on unexpected errors.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/update-student-status/route';

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

jest.mock('@/lib/services/student-activity-service', () => ({
  updateStudentActivityStatus: jest.fn(),
}));

import { updateStudentActivityStatus } from '@/lib/services/student-activity-service';

const CRON_SECRET = 'test-cron-secret';

function makeRequest(): Request {
  return new NextRequest('http://localhost/api/cron/update-student-status', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

describe('GET /api/cron/update-student-status', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 401 without a valid cron secret', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/update-student-status'));
    expect(res.status).toBe(401);
  });

  it('returns 200 and forwards status-update counts on success', async () => {
    (updateStudentActivityStatus as jest.Mock).mockResolvedValue({
      processed: 12,
      activatedCount: 2,
      deactivatedCount: 3,
      activated: [{ id: 'u1', email: 'a@test.com', full_name: 'A' }],
      deactivated: [{ id: 'u2', email: 'b@test.com', full_name: 'B' }],
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.processed).toBe(12);
    expect(body.activatedCount).toBe(2);
    expect(body.deactivatedCount).toBe(3);
  });

  it('returns 200 (not 500) when updateStudentActivityStatus throws', async () => {
    (updateStudentActivityStatus as jest.Mock).mockRejectedValue(new Error('DB unavailable'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.error).toBe('Internal server error');
  });
});
