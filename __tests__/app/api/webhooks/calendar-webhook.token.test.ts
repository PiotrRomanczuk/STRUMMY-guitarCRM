/**
 * Tests for Google Calendar webhook hardening (spec 7.7).
 *
 * Guards:
 *  - prod request with no secret → 401
 *  - CALENDAR_WEBHOOK_SKIP_TOKEN=true allows skip when no secret configured
 *  - unknown x-goog-resource-state values are not processed
 *  - 'sync' state is always acknowledged with 200
 *  - 'exists'/'not_exists' states are processed
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhooks/google-calendar/route';

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

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(),
}));

jest.mock('@/lib/services/google-calendar-sync', () => ({
  fetchAndSyncRecentEvents: jest.fn().mockResolvedValue({ success: true, count: 0 }),
}));

import { createAdminClient } from '@/lib/supabase/admin';

const WEBHOOK_SECRET = 'webhook-secret-abc';
const CHANNEL_ID = 'ch-test-123';
const RESOURCE_ID = 'res-test-456';

function makeRequest(
  resourceState: string,
  token?: string,
  extraHeaders: Record<string, string> = {}
): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/google-calendar', {
    method: 'POST',
    headers: {
      'x-goog-channel-id': CHANNEL_ID,
      'x-goog-resource-id': RESOURCE_ID,
      'x-goog-resource-state': resourceState,
      ...(token ? { 'x-goog-channel-token': token } : {}),
      ...extraHeaders,
    },
  });
}

function mockSubscriptionFound() {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { user_id: 'teacher-uuid' },
      error: null,
    }),
  };
  (createAdminClient as jest.Mock).mockReturnValue({ from: jest.fn(() => chain) });
}

function mockSubscriptionNotFound() {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
  };
  (createAdminClient as jest.Mock).mockReturnValue({ from: jest.fn(() => chain) });
}

describe('POST /api/webhooks/google-calendar — token & resource-state (7.7)', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  // --- Token validation ---

  it('returns 401 when GOOGLE_CALENDAR_WEBHOOK_SECRET is set but token is missing', async () => {
    process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const res = await POST(makeRequest('sync')); // no token header
    expect(res.status).toBe(401);
  });

  it('returns 401 when token does not match the configured secret', async () => {
    process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const res = await POST(makeRequest('sync', 'wrong-token'));
    expect(res.status).toBe(401);
  });

  it('returns 401 when secret is not configured and CALENDAR_WEBHOOK_SKIP_TOKEN is not set', async () => {
    delete process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET;
    delete process.env.CALENDAR_WEBHOOK_SKIP_TOKEN;

    const res = await POST(makeRequest('sync'));
    expect(res.status).toBe(401);
  });

  it('allows request when CALENDAR_WEBHOOK_SKIP_TOKEN=true and no secret configured', async () => {
    delete process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET;
    process.env.CALENDAR_WEBHOOK_SKIP_TOKEN = 'true';

    const res = await POST(makeRequest('sync'));
    // 'sync' → 200 ack, not 401
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  it('does NOT skip when NODE_ENV=development but CALENDAR_WEBHOOK_SKIP_TOKEN is absent', async () => {
    delete process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET;
    delete process.env.CALENDAR_WEBHOOK_SKIP_TOKEN;
    process.env.NODE_ENV = 'development';

    const res = await POST(makeRequest('sync'));
    expect(res.status).toBe(401);
  });

  // --- Resource-state validation ---

  it('acknowledges sync state with 200 + {status:"ok"}', async () => {
    process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const res = await POST(makeRequest('sync', WEBHOOK_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  it('ignores unknown resource-state without processing', async () => {
    process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const res = await POST(makeRequest('unknown_state', WEBHOOK_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ignored');
  });

  it('ignores "watch" resource-state (not a valid processing state)', async () => {
    process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const res = await POST(makeRequest('watch', WEBHOOK_SECRET));
    const body = await res.json();
    expect(body.status).toBe('ignored');
  });

  it('processes exists state by looking up subscription', async () => {
    process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET = WEBHOOK_SECRET;
    mockSubscriptionNotFound();

    const res = await POST(makeRequest('exists', WEBHOOK_SECRET));
    // subscription not found → 200 + ignored (not a processing error)
    expect(res.status).toBe(200);
    // createAdminClient was called → we reached the processing branch
    expect(createAdminClient).toHaveBeenCalled();
  });

  it('processes not_exists state by looking up subscription', async () => {
    process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET = WEBHOOK_SECRET;
    mockSubscriptionNotFound();

    const res = await POST(makeRequest('not_exists', WEBHOOK_SECRET));
    expect(res.status).toBe(200);
    expect(createAdminClient).toHaveBeenCalled();
  });

  it('triggers sync when exists state matches a known subscription', async () => {
    process.env.GOOGLE_CALENDAR_WEBHOOK_SECRET = WEBHOOK_SECRET;
    mockSubscriptionFound();

    const { fetchAndSyncRecentEvents } = jest.requireMock(
      '@/lib/services/google-calendar-sync'
    ) as { fetchAndSyncRecentEvents: jest.Mock };

    const res = await POST(makeRequest('exists', WEBHOOK_SECRET));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('processed');

    // Give the non-awaited background promise a tick to fire
    await Promise.resolve();
    expect(fetchAndSyncRecentEvents).toHaveBeenCalledWith('teacher-uuid');
  });
});
