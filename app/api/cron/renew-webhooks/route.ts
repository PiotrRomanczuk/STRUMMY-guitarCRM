/**
 * Cron endpoint for renewing expiring Google Calendar webhooks
 *
 * This endpoint should be called daily by Vercel Cron or another scheduler
 * to ensure webhook subscriptions don't expire.
 *
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import { renewExpiringWebhooks, cleanupExpiredWebhooks } from '@/lib/services/webhook-renewal';
import { verifyCronSecret } from '@/lib/auth/cron-auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    // Renew expiring webhooks
    const renewalSummary = await renewExpiringWebhooks();

    // Clean up expired webhooks from database
    const cleanedUp = await cleanupExpiredWebhooks();

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      renewal: {
        totalChecked: renewalSummary.totalChecked,
        renewed: renewalSummary.renewed,
        failed: renewalSummary.failed,
      },
      cleanup: {
        deleted: cleanedUp,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error('Cron job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
