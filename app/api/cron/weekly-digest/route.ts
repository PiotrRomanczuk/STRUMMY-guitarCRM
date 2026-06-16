/**
 * Cron Job: Weekly Progress Digest
 *
 * Runs every Sunday at 6 PM to generate and send weekly progress reports
 * to students who have opted in.
 *
 * Schedule: Sundays at 6:00 PM
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { queueNotification } from '@/lib/services/notification-service';
import { verifyCronSecret } from '@/lib/auth/cron-auth';
import { isMissingTableError } from '@/lib/services/db-error-helpers';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  try {
    const supabase = createAdminClient();

    // Get all students who have weekly digest enabled
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select(
        `
        user_id,
        profiles!inner(
          id,
          email,
          full_name,
          is_student
        )
      `
      )
      .eq('notification_type', 'weekly_progress_digest')
      .eq('enabled', true)
      .eq('profiles.is_student', true);

    if (prefError) {
      // Degrade gracefully when the table is not yet present in the target DB
      // (notification_preferences is restored as part of Phase 0.1). Skip
      // rather than report a failure so the cron does not 500/page on a known
      // pending schema dependency.
      if (isMissingTableError(prefError)) {
        logger.warn('[Cron] notification_preferences table absent — skipping weekly digest', {
          code: prefError.code,
        });
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: 'notification_preferences table not available',
          count: 0,
        });
      }

      logger.error('[Cron] Error fetching preferences:', prefError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch preferences' },
        { status: 200 }
      );
    }

    if (!preferences || preferences.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No recipients for weekly digest',
        count: 0,
      });
    }

    // Calculate week range (last 7 days)
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let queued = 0;
    let failed = 0;

    // Generate digest for each student
    for (const pref of preferences) {
      try {
        const studentId = pref.user_id;

        // Get lessons completed this week
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, scheduled_at, title, status')
          .eq('student_id', studentId)
          .eq('status', 'COMPLETED')
          .gte('scheduled_at', weekStart.toISOString())
          .lte('scheduled_at', now.toISOString());

        // Get songs mastered this week
        const { data: masteredSongs } = await supabase
          .from('lesson_songs')
          .select(
            `
            id,
            status,
            lessons!inner(student_id, updated_at),
            songs(title, artist)
          `
          )
          .eq('lessons.student_id', studentId)
          .eq('status', 'mastered')
          .gte('lessons.updated_at', weekStart.toISOString());

        // Get upcoming lessons for next week
        const nextWeekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const { data: upcomingLessons } = await supabase
          .from('lessons')
          .select('id, scheduled_at, title')
          .eq('student_id', studentId)
          .eq('status', 'SCHEDULED')
          .gte('scheduled_at', now.toISOString())
          .lte('scheduled_at', nextWeekEnd.toISOString())
          .order('scheduled_at', { ascending: true });

        const weekStartFormatted = weekStart.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        const weekEndFormatted = now.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });

        const highlights: string[] = [];
        if (lessons && lessons.length > 0) {
          highlights.push(`Completed ${lessons.length} lesson${lessons.length > 1 ? 's' : ''}`);
        }
        if (masteredSongs && masteredSongs.length > 0) {
          highlights.push(
            `Mastered ${masteredSongs.length} new song${masteredSongs.length > 1 ? 's' : ''}`
          );
        }

        await queueNotification({
          type: 'weekly_progress_digest',
          recipientUserId: studentId,
          templateData: {
            recipientName: pref.profiles?.full_name || 'Student',
            weekStart: weekStartFormatted,
            weekEnd: weekEndFormatted,
            lessonsCompleted: lessons?.length || 0,
            songsMastered: masteredSongs?.length || 0,
            practiceTime: 0,
            highlights,
            upcomingLessons:
              upcomingLessons?.map((l) => ({
                date: new Date(l.scheduled_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                }),
                title: l.title || 'Guitar Lesson',
              })) || [],
          },
          entityType: 'profile',
          entityId: studentId,
          priority: 4, // Lower priority (digest email)
        });

        queued++;
      } catch (notificationError) {
        logger.error(
          `[Cron] Failed to queue weekly digest for ${pref.user_id}:`,
          notificationError
        );
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      queued,
      failed,
      total: preferences.length,
    });
  } catch (error) {
    logger.error('[Cron] Unexpected error in weekly digest generation:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 200 });
  }
}
