/**
 * Regression tests for GET /api/cron/dispatcher (item #20 in
 * tasks/critical-path-tests.md: "assert it dispatches to expected sub-jobs").
 *
 * The dispatcher is the single Vercel Cron entry point (Hobby plan allows
 * only one cron definition) that fans out to every sub-job in parallel via
 * Promise.allSettled. It imports some jobs as route GET handlers
 * (drive-video-scan, lesson-reminders, assignment-due-reminders,
 * assignment-overdue-check, weekly-digest) and others as plain service
 * functions. All of those are mocked here so the test only verifies the
 * dispatcher's own fan-out/aggregation logic, not the sub-jobs' internals
 * (which are covered by their own dedicated test files).
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/cron/dispatcher/route';

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

// --- Route-handler jobs (imported by the dispatcher as `GET as run<X>`) ---
// Each factory inlines its own response literal (rather than sharing one
// module-scope const) because jest.mock() factories are hoisted above all
// other statements in the file, including const declarations — a shared
// reference would throw "Cannot access before initialization".
jest.mock('@/app/api/cron/drive-video-scan/route', () => ({
  GET: jest.fn().mockResolvedValue({ json: async () => ({ success: true }) }),
}));
jest.mock('@/app/api/cron/lesson-reminders/route', () => ({
  GET: jest.fn().mockResolvedValue({ json: async () => ({ success: true }) }),
}));
jest.mock('@/app/api/cron/assignment-due-reminders/route', () => ({
  GET: jest.fn().mockResolvedValue({ json: async () => ({ success: true }) }),
}));
jest.mock('@/app/api/cron/assignment-overdue-check/route', () => ({
  GET: jest.fn().mockResolvedValue({ json: async () => ({ success: true }) }),
}));
jest.mock('@/app/api/cron/weekly-digest/route', () => ({
  GET: jest.fn().mockResolvedValue({ json: async () => ({ success: true }) }),
}));

// --- Service-function jobs ---
jest.mock('@/app/actions/email/send-admin-report', () => ({
  sendAdminSongReport: jest.fn(),
}));
jest.mock('@/app/actions/email/send-weekly-insights', () => ({
  sendWeeklyInsights: jest.fn(),
}));
jest.mock('@/lib/services/student-activity-service', () => ({
  updateStudentActivityStatus: jest.fn(),
}));
jest.mock('@/lib/services/calendar-sync-service', () => ({
  syncAllTeacherCalendars: jest.fn(),
}));
jest.mock('@/lib/services/webhook-renewal', () => ({
  renewExpiringWebhooks: jest.fn(),
  cleanupExpiredWebhooks: jest.fn(),
}));
jest.mock('@/lib/services/notification-queue-processor', () => ({
  processQueuedNotifications: jest.fn(),
  retryFailedNotifications: jest.fn(),
}));
jest.mock('@/lib/auth/rate-limiter', () => ({
  cleanupExpiredAuthEntries: jest.fn(),
}));
jest.mock('@/lib/services/notification-monitoring', () => ({
  checkFailureRate: jest.fn(),
  checkBounceRate: jest.fn(),
  checkQueueBacklog: jest.fn(),
  sendDailyAdminSummary: jest.fn(),
}));

import { GET as runDriveVideoScan } from '@/app/api/cron/drive-video-scan/route';
import { GET as runLessonReminders } from '@/app/api/cron/lesson-reminders/route';
import { GET as runAssignmentDueReminders } from '@/app/api/cron/assignment-due-reminders/route';
import { GET as runAssignmentOverdueCheck } from '@/app/api/cron/assignment-overdue-check/route';
import { GET as runWeeklyDigest } from '@/app/api/cron/weekly-digest/route';
import { sendAdminSongReport } from '@/app/actions/email/send-admin-report';
import { sendWeeklyInsights } from '@/app/actions/email/send-weekly-insights';
import { updateStudentActivityStatus } from '@/lib/services/student-activity-service';
import { syncAllTeacherCalendars } from '@/lib/services/calendar-sync-service';
import { renewExpiringWebhooks, cleanupExpiredWebhooks } from '@/lib/services/webhook-renewal';
import {
  processQueuedNotifications,
  retryFailedNotifications,
} from '@/lib/services/notification-queue-processor';
import { cleanupExpiredAuthEntries } from '@/lib/auth/rate-limiter';
import {
  checkFailureRate,
  checkBounceRate,
  checkQueueBacklog,
  sendDailyAdminSummary,
} from '@/lib/services/notification-monitoring';

const CRON_SECRET = 'test-cron-secret';

function makeRequest(): Request {
  return new NextRequest('http://localhost/api/cron/dispatcher', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

/** All service-function mocks resolved to a "success" shape, reused per test. */
function resolveAllJobsSuccessfully() {
  (sendAdminSongReport as jest.Mock).mockResolvedValue({ success: true });
  (sendWeeklyInsights as jest.Mock).mockResolvedValue({ success: true, emailsSent: 1 });
  (updateStudentActivityStatus as jest.Mock).mockResolvedValue({ processed: 0 });
  (syncAllTeacherCalendars as jest.Mock).mockResolvedValue({ teachersSynced: 0 });
  (renewExpiringWebhooks as jest.Mock).mockResolvedValue({ totalChecked: 0 });
  (cleanupExpiredWebhooks as jest.Mock).mockResolvedValue(0);
  (processQueuedNotifications as jest.Mock).mockResolvedValue({ processed: 0, failed: 0 });
  (retryFailedNotifications as jest.Mock).mockResolvedValue({
    retried: 0,
    failed: 0,
    deadLettered: 0,
  });
  (cleanupExpiredAuthEntries as jest.Mock).mockResolvedValue(undefined);
  (checkFailureRate as jest.Mock).mockResolvedValue(undefined);
  (checkBounceRate as jest.Mock).mockResolvedValue(undefined);
  (checkQueueBacklog as jest.Mock).mockResolvedValue(undefined);
  (sendDailyAdminSummary as jest.Mock).mockResolvedValue(undefined);
}

describe('GET /api/cron/dispatcher', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, CRON_SECRET };
    resolveAllJobsSuccessfully();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns 401 without a valid cron secret', async () => {
    const res = await GET(new NextRequest('http://localhost/api/cron/dispatcher'));
    expect(res.status).toBe(401);
  });

  it('dispatches to every daily sub-job exactly once (non-Sunday/Monday)', async () => {
    // Tuesday — neither the weekly-digest (Sunday) nor weekly-insights (Monday) job should run
    jest.useFakeTimers().setSystemTime(new Date('2026-07-21T06:00:00Z'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.summary.total).toBe(9);
    expect(body.summary.succeeded).toBe(9);
    expect(body.summary.failed).toBe(0);

    const jobNames = body.jobs.map((j: { name: string }) => j.name);
    expect(jobNames).toEqual(
      expect.arrayContaining([
        'daily-report',
        'lesson-reminders',
        'assignment-due-reminders',
        'assignment-overdue-check',
        'drive-video-scan',
        'sync-calendars-and-update-status',
        'renew-webhooks',
        'process-notification-queue',
        'admin-monitoring',
      ])
    );
    expect(jobNames).not.toContain('weekly-digest');
    expect(jobNames).not.toContain('weekly-insights');

    expect(sendAdminSongReport).toHaveBeenCalledTimes(1);
    expect(runLessonReminders).toHaveBeenCalledTimes(1);
    expect(runAssignmentDueReminders).toHaveBeenCalledTimes(1);
    expect(runAssignmentOverdueCheck).toHaveBeenCalledTimes(1);
    expect(runDriveVideoScan).toHaveBeenCalledTimes(1);
    expect(syncAllTeacherCalendars).toHaveBeenCalledTimes(1);
    expect(updateStudentActivityStatus).toHaveBeenCalledTimes(1);
    expect(renewExpiringWebhooks).toHaveBeenCalledTimes(1);
    expect(cleanupExpiredWebhooks).toHaveBeenCalledTimes(1);
    expect(processQueuedNotifications).toHaveBeenCalledTimes(1);
    expect(retryFailedNotifications).toHaveBeenCalledTimes(1);
    expect(cleanupExpiredAuthEntries).toHaveBeenCalledTimes(1);
    expect(checkFailureRate).toHaveBeenCalledTimes(1);
    expect(checkBounceRate).toHaveBeenCalledTimes(1);
    expect(checkQueueBacklog).toHaveBeenCalledTimes(1);
    expect(sendDailyAdminSummary).toHaveBeenCalledTimes(1);
    expect(runWeeklyDigest).not.toHaveBeenCalled();
    expect(sendWeeklyInsights).not.toHaveBeenCalled();
  });

  it('additionally dispatches the weekly-digest job on Sundays', async () => {
    // 2026-07-19 is a Sunday (UTC)
    jest.useFakeTimers().setSystemTime(new Date('2026-07-19T06:00:00Z'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.summary.total).toBe(10);
    expect(body.jobs.map((j: { name: string }) => j.name)).toContain('weekly-digest');
    expect(runWeeklyDigest).toHaveBeenCalledTimes(1);
    expect(sendWeeklyInsights).not.toHaveBeenCalled();
  });

  it('additionally dispatches the weekly-insights job on Mondays', async () => {
    // 2026-07-20 is a Monday (UTC)
    jest.useFakeTimers().setSystemTime(new Date('2026-07-20T06:00:00Z'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.summary.total).toBe(10);
    expect(body.jobs.map((j: { name: string }) => j.name)).toContain('weekly-insights');
    expect(sendWeeklyInsights).toHaveBeenCalledTimes(1);
    expect(runWeeklyDigest).not.toHaveBeenCalled();
  });

  it('marks a single failed sub-job as errored without blocking the others', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-21T06:00:00Z'));
    (syncAllTeacherCalendars as jest.Mock).mockRejectedValue(new Error('calendar API down'));

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.summary.failed).toBe(1);
    expect(body.summary.succeeded).toBe(8);

    const failedJob = body.jobs.find(
      (j: { name: string }) => j.name === 'sync-calendars-and-update-status'
    );
    expect(failedJob.status).toBe('error');
    expect(failedJob.error).toBe('calendar API down');

    // Independent jobs still ran despite the failure
    expect(sendAdminSongReport).toHaveBeenCalledTimes(1);
    expect(checkFailureRate).toHaveBeenCalledTimes(1);
  });
});
