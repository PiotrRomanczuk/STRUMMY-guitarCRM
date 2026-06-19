/**
 * Calendar-sync endpoint — polls all teachers' Google Calendars via
 * syncAllTeacherCalendars(), covering teachers who never enable the webhook.
 *
 * NOT registered as a dedicated Vercel cron (spec 07.3 option a): an every-6h
 * entry exceeded the project's Vercel cron limit and failed the deploy, so the
 * scheduled polling runs through the existing dispatcher cron
 * (app/api/cron/dispatcher 'sync-calendars-and-update-status' step) instead.
 * This route is retained for manual / on-demand invocation, secret-guarded.
 */

import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/cron-auth';
import { syncAllTeacherCalendars } from '@/lib/services/calendar-sync-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request): Promise<NextResponse> {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  logger.info('[CalendarSyncCron] Starting scheduled calendar sync');

  try {
    const result = await syncAllTeacherCalendars();

    logger.info('[CalendarSyncCron] Sync complete', { ...result });

    return NextResponse.json({
      success: true,
      teachersSynced: result.teachersSynced,
      lessonsImported: result.lessonsImported,
      lessonsSkipped: result.lessonsSkipped,
      errors: result.errors,
    });
  } catch (error) {
    logger.error('[CalendarSyncCron] Unexpected error:', error);

    // Never return 500 — Vercel marks the cron as failed and retries aggressively
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      teachersSynced: 0,
      lessonsImported: 0,
      lessonsSkipped: 0,
      errors: [],
    });
  }
}
