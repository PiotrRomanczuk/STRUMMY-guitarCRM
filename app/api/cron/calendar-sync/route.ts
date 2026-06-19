/**
 * Dedicated calendar-sync cron — polls all teachers' Google Calendars every 6 h.
 * Covers teachers who never enable the webhook subscription (the only freshness
 * path for them). The dispatcher already calls syncAllTeacherCalendars() daily;
 * this route adds a higher-frequency dedicated schedule.
 *
 * Schedule (vercel.json): 0 *\/6 * * *  (every 6 hours)
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
