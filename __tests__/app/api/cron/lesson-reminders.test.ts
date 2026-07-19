/**
 * Regression tests for GET /api/cron/lesson-reminders.
 *
 * Guards auth gating, the empty-result path, the happy path (queues a
 * 24h reminder per lesson), and graceful degradation on a DB error and a
 * single failed queueNotification call. The route also emits home-ops
 * observability events (lib/observability/home-ops-log.mjs), which
 * no-op when INGEST_URL/INGEST_TOKEN aren't set — left unmocked.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/lesson-reminders/route';

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
  return new NextRequest('http://localhost/api/cron/lesson-reminders', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

/**
 * Builds a Supabase client stub for the
 * `.from('lessons').select(...).eq().gte().lte()` chain used by this route.
 */
function mockLessonsClient(result: { data: unknown; error: unknown }) {
  const lte = jest.fn().mockResolvedValue(result);
  const gte = jest.fn(() => ({ lte }));
  const eq = jest.fn(() => ({ gte }));
  const select = jest.fn(() => ({ eq }));
  return { from: jest.fn(() => ({ select })) };
}

describe('GET /api/cron/lesson-reminders', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 401 without a valid cron secret', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/lesson-reminders'));
    expect(res.status).toBe(401);
  });

  it('returns 200 with count 0 when no lessons are in the reminder window', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(mockLessonsClient({ data: [], error: null }));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.count).toBe(0);
    expect(queueNotification).not.toHaveBeenCalled();
  });

  it('queues a 24h reminder for each lesson in the window', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockLessonsClient({
        data: [
          {
            id: 'l1',
            scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            title: 'Fingerstyle basics',
            notes: 'Bring capo',
            student_id: 'student-1',
            teacher_id: 'teacher-1',
            student_profile: { id: 'student-1', email: 's1@test.com', full_name: 'Student One' },
            teacher_profile: { id: 'teacher-1', email: 't1@test.com', full_name: 'Teacher One' },
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
    expect(body.queued).toBe(1);
    expect(body.failed).toBe(0);
    expect(body.total).toBe(1);
    expect(queueNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'lesson_reminder_24h',
        recipientUserId: 'student-1',
        entityType: 'lesson',
        entityId: 'l1',
        templateData: expect.objectContaining({
          studentName: 'Student One',
          teacherName: 'Teacher One',
          lessonTitle: 'Fingerstyle basics',
        }),
      })
    );
  });

  it('counts a failed queueNotification without failing the whole batch', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockLessonsClient({
        data: [
          {
            id: 'l1',
            scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            title: null,
            notes: null,
            student_id: 'student-1',
            teacher_id: 'teacher-1',
            student_profile: null,
            teacher_profile: null,
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

  it('returns 200 with success:false when fetching lessons fails', async () => {
    (createAdminClient as jest.Mock).mockReturnValue(
      mockLessonsClient({ data: null, error: { message: 'connection failure' } })
    );

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
  });
});
