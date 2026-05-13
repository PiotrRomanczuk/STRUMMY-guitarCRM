/**
 * Cron Job: Process Notification Queue
 *
 * Runs every 15 minutes to process pending notifications from the queue
 * and send them via email.
 *
 * Schedule: Every 15 minutes
 */

import { NextResponse } from 'next/server';
import { processQueuedNotifications, retryFailedNotifications } from '@/lib/services/notification-queue-processor';
import { cleanupExpiredAuthEntries } from '@/lib/auth/rate-limiter';
import {
  logCronStart,
  logCronComplete,
  logCronError,
} from '@/lib/logging/notification-logger';
import { verifyCronSecret } from '@/lib/auth/cron-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  const startTime = Date.now();

  try {
    logCronStart('process-notification-queue');

    // Process pending notifications from the queue
    const queueResult = await processQueuedNotifications(100); // Process up to 100 at a time

    // Also retry failed notifications
    const retryResult = await retryFailedNotifications();

    // Cleanup expired auth rate limit entries
    await cleanupExpiredAuthEntries();

    const duration = Date.now() - startTime;

    logCronComplete('process-notification-queue', duration, {
      queue_processed: queueResult.processed,
      queue_failed: queueResult.failed,
      retry_retried: retryResult.retried,
      retry_failed: retryResult.failed,
      retry_dead_lettered: retryResult.deadLettered,
    });

    return NextResponse.json({
      success: true,
      queue: {
        processed: queueResult.processed,
        failed: queueResult.failed,
      },
      retry: {
        retried: retryResult.retried,
        failed: retryResult.failed,
        deadLettered: retryResult.deadLettered,
      },
    });
  } catch (error) {
    logCronError(
      'process-notification-queue',
      error instanceof Error ? error : new Error('Unknown error')
    );

    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 200 }
    );
  }
}
