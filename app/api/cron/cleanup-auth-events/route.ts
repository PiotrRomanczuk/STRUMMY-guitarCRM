/**
 * Cron Job: GDPR Auth Events Cleanup
 *
 * Deletes auth_events rows older than 90 days to comply with GDPR
 * data retention requirements. The auth_events table stores PII
 * (email addresses, IP addresses) that must not be retained indefinitely.
 *
 * Schedule: Daily at 3:30 AM UTC
 *
 * @route GET /api/cron/cleanup-auth-events
 */

import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/cron-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';

const RETENTION_DAYS = 90;

const log = createLogger('cron:cleanup-auth-events');

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    const supabase = createAdminClient();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    const cutoffISO = cutoffDate.toISOString();

    const { data, error } = await supabase
      .from('auth_events' as never)
      .delete()
      .lt('occurred_at', cutoffISO)
      .select('id' as never);

    if (error) {
      log.error('Failed to delete expired auth events', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Database deletion failed',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    const deletedCount = (data as unknown[] | null)?.length ?? 0;

    log.info('Auth events cleanup completed', {
      deletedCount,
      cutoffDate: cutoffISO,
      retentionDays: RETENTION_DAYS,
    });

    return NextResponse.json({
      success: true,
      deletedCount,
      cutoffDate: cutoffISO,
      retentionDays: RETENTION_DAYS,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error('Unexpected error during auth events cleanup', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
