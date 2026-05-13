/**
 * Vercel Cron Job: Update Student Activity Status
 *
 * Runs daily at 2 AM UTC to automatically update student_status based on lesson activity:
 * - Students become "inactive" if no completed lesson in last 28 days AND no future scheduled lessons
 * - Students return to "active" if they have a future scheduled lesson
 *
 * @route GET /api/cron/update-student-status
 */

import { NextResponse } from 'next/server';
import { updateStudentActivityStatus } from '@/lib/services/student-activity-service';
import { verifyCronSecret } from '@/lib/auth/cron-auth';
import { logger } from '@/lib/logger';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authError = verifyCronSecret(request);
    if (authError) return authError;

    const result = await updateStudentActivityStatus();

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('[Cron] Student status update failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 200 }
    );
  }
}
