import { NextResponse } from 'next/server';
import { sendWeeklyInsights } from '@/app/actions/email/send-weekly-insights';
import { verifyCronSecret } from '@/lib/auth/cron-auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/weekly-insights
 * Cron job that sends weekly insight emails to all teachers
 * Runs every Monday at 9 AM UTC
 */
export async function GET(request: Request) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    const result = await sendWeeklyInsights();

    if (result.success) {
      return NextResponse.json({
        success: true,
        emailsSent: result.emailsSent,
      });
    } else {
      logger.error('[Cron] Failed to send weekly insights:', result.errors);
      return NextResponse.json(
        {
          success: false,
          emailsSent: result.emailsSent,
          errors: result.errors,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    logger.error('[Cron] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 200 }
    );
  }
}
