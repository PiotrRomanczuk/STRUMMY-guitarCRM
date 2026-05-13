import { NextResponse } from 'next/server';
import { sendAdminSongReport } from '@/app/actions/email/send-admin-report';
import { verifyCronSecret } from '@/lib/auth/cron-auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic'; // static by default, unless reading the request

export async function GET(request: Request) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    const result = await sendAdminSongReport();

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      logger.error('[Cron] Failed to send daily song report:', result.error);
      return NextResponse.json({ success: false, error: result.error }, { status: 200 });
    }
  } catch (error) {
    logger.error('[Cron] Unexpected error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 200 });
  }
}
