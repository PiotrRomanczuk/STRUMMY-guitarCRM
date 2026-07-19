/**
 * Regression tests for GET /api/cron/assignment-due-reminders.
 *
 * Guards auth gating, the empty-result path, the happy path (queues a
 * reminder notification per assignment due in ~2 days), and graceful
 * degradation on a DB error and on a single failed queueNotification call.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/assignment-due-reminders/route';

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

jest.mock('@/lib/services/notification-service', () => ({
  queueNotification: jest.fn(),
}));

import { createAdminClient } from '@/lib/supabase/admin';
import { queueNotification } from '@/lib/services/notification-service';

const CRON_SECRET = 'test-cron-secret';

function makeRequest(): Request {
  return new NextRequest('http://localhost/api/cron/assignment-due-reminders', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

/**
 * Builds a Supabase client stub for the `.from('assignments').select(...).in().gte().lte()`
 * chain used by this route.
 */
function mockAssignmentsClient(result: { data: unknown; error: unknown }) {
  const lte = jest.fn().mockResolvedValue(result);
  const gte = jest.fn(() => ({ lte }));
  const inFn = jest.fn(() => ({ gte }));
  const select = jest.fn(() => ({ in: inFn }));
  return { from: jest.fn(() => ({ select })) };
}

describe('GET /api/cron/assignment-due-reminders', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 401 without a valid cron secret', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/assignment-due-reminders'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with count 0 when no assignments are due soon', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockAssignmentsClient({ data: [], error: null })
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.count).toBe(0);
    expect(queueNotification).not.toHaveBeenCalled();
  });

  it('queues a reminder notification for each assignment due in ~2 days', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockAssignmentsClient({
        data: [
          {
            id: 'a1',
            title: 'Practice scales',
            description: 'Major scale, all positions',
            due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            student_id: 'student-1',
            student_profile: { id: 'student-1', email: 's1@test.com', full_name: 'Student One' },
          },
          {
            id: 'a2',
            title: 'Learn chord progression',
            description: null,
            due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            student_id: 'student-2',
            student_profile: null,
          },
        ],
        error: null,
      })
    );
    (queueNotification as jest.Mock).mockResolvedValue({ success: true });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.queued).toBe(2);
    expect(body.failed).toBe(0);
    expect(body.total).toBe(2);
    expect(queueNotification).toHaveBeenCalledTimes(2);
    expect(queueNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'assignment_due_reminder',
        recipientUserId: 'student-1',
        entityType: 'assignment',
        entityId: 'a1',
        templateData: expect.objectContaining({
          studentName: 'Student One',
          assignmentTitle: 'Practice scales',
        }),
      })
    );
  });

  it('counts a failed queueNotification without failing the whole batch', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockAssignmentsClient({
        data: [
          {
            id: 'a1',
            title: 'Practice scales',
            description: null,
            due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            student_id: 'student-1',
            student_profile: { id: 'student-1', email: 's1@test.com', full_name: 'Student One' },
          },
        ],
        error: null,
      })
    );
    (queueNotification as jest.Mock).mockRejectedValue(new Error('Queue unavailable'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.queued).toBe(0);
    expect(body.failed).toBe(1);
  });

  it('returns 200 with success:false when fetching assignments fails', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockAssignmentsClient({ data: null, error: { message: 'connection failure' } })
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
  });
});
