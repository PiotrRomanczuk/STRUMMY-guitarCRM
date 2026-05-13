import { NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/cron-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncDriveVideosToSongs } from '@/lib/services/drive-video-sync';
import { createInAppNotification } from '@/lib/services/in-app-notification-service';
import { createLogger } from '@/lib/logger';

const log = createLogger('DriveVideoScanCron');

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/drive-video-scan
 * Daily cron job that scans Google Drive for new videos and notifies admins
 * Runs at 3:00 AM UTC (off-peak hours)
 */
export async function GET(request: Request) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    log.info('Starting automated Drive video scan');

    // Get admin client (bypasses RLS)
    const adminClient = createAdminClient();

    // Get first admin/teacher user ID for uploaded_by (required field)
    const { data: admins, error: adminError } = await adminClient
      .from('profiles')
      .select('id')
      .or('is_admin.eq.true,is_teacher.eq.true')
      .limit(1);

    if (adminError || !admins || admins.length === 0) {
      log.error('No admin/teacher users found', { error: adminError });
      return NextResponse.json(
        { success: false, error: 'No admin users found' },
        { status: 200 }
      );
    }

    const adminUserId = admins[0].id;

    // Run dry-run scan to check for videos needing review
    const result = await syncDriveVideosToSongs({
      dryRun: true,
      uploadedByUserId: adminUserId,
      supabase: adminClient,
    });

    log.info('Drive scan completed', {
      totalFiles: result.totalFiles,
      matched: result.matched,
      reviewQueue: result.reviewQueue,
      unmatched: result.unmatched,
      skipped: result.skipped,
    });

    // Calculate videos needing review
    const needsReview = result.reviewQueue + result.unmatched;

    // If videos need review, notify all admins
    if (needsReview > 0) {
      log.info('Videos need review, sending notifications', { needsReview });

      // Get all admin users
      const { data: allAdmins, error: allAdminsError } = await adminClient
        .from('profiles')
        .select('id')
        .eq('is_admin', true);

      if (allAdminsError || !allAdmins) {
        log.error('Failed to fetch admin users', { error: allAdminsError });
      } else {
        // Send notification to each admin
        const notificationPromises = allAdmins.map((admin) =>
          createInAppNotification({
            type: 'admin_error_alert',
            recipientUserId: admin.id,
            title: `${needsReview} Drive video${needsReview === 1 ? '' : 's'} need review`,
            body: `Found ${result.reviewQueue} videos in review queue and ${result.unmatched} unmatched videos from Google Drive scan`,
            icon: '📹',
            variant: 'info',
            actionUrl: '/dashboard/admin/drive-videos?tab=review',
            actionLabel: 'Review Videos',
            priority: 7, // Important but not critical
          })
        );

        await Promise.all(notificationPromises);
        log.info('Sent notifications to admins', { count: allAdmins.length });
      }
    } else {
      log.info('No videos need review');
    }

    return NextResponse.json({
      success: true,
      scan: {
        totalFiles: result.totalFiles,
        matched: result.matched,
        reviewQueue: result.reviewQueue,
        unmatched: result.unmatched,
        skipped: result.skipped,
      },
      needsReview,
      notificationsSent: needsReview > 0,
    });
  } catch (error) {
    log.error('Drive video scan cron failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal Server Error',
      },
      { status: 200 }
    );
  }
}
