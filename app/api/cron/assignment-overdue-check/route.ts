/**
 * Cron Job: Assignment Overdue Check
 *
 * Runs daily at 6 PM to find assignments that have become overdue
 * and queue alert notifications for students.
 *
 * Schedule: Daily at 6:00 PM
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { queueNotification } from '@/lib/services/notification-service';
import {
  logCronStart,
  logCronComplete,
  logCronError,
  logError,
} from '@/lib/logging/notification-logger';
import { verifyCronSecret } from '@/lib/auth/cron-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authError = verifyCronSecret(request);
  if (authError) return authError;

  const startTime = Date.now();

  try {
    logCronStart('assignment-overdue-check');

    const supabase = createAdminClient();

    // Find assignments that are overdue (due_date < now) and not yet completed
    const now = new Date();

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        due_date,
        student_id,
        student_profile:profiles!assignments_student_id_fkey(id, email, full_name)
      `)
      .in('status', ['not_started', 'in_progress'])
      .lt('due_date', now.toISOString());

    if (error) {
      logCronError(
        'assignment-overdue-check',
        error instanceof Error ? error : new Error('Failed to fetch overdue assignments')
      );
      return NextResponse.json(
        { success: false, error: 'Failed to fetch overdue assignments' },
        { status: 200 }
      );
    }

    if (!assignments || assignments.length === 0) {
      logCronComplete('assignment-overdue-check', Date.now() - startTime, {
        assignments_found: 0,
      });
      return NextResponse.json({
        success: true,
        message: 'No overdue assignments',
        count: 0,
      });
    }

    // Update assignment status to overdue
    const assignmentIds = assignments.map((a) => a.id);
    await supabase
      .from('assignments')
      .update({ status: 'overdue' })
      .in('id', assignmentIds);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL_REMOTE ||
      'https://example.com';

    let queued = 0;
    let failed = 0;

    // Queue an overdue alert for each assignment
    for (const assignment of assignments) {
      try {
        const dueDate = new Date(assignment.due_date!);
        const dueDateFormatted = dueDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // Calculate days overdue
        const daysOverdue = Math.ceil(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        await queueNotification({
          type: 'assignment_overdue_alert',
          recipientUserId: assignment.student_id,
          templateData: {
            studentName: assignment.student_profile?.full_name || 'Student',
            assignmentTitle: assignment.title,
            dueDate: dueDateFormatted,
            daysOverdue,
            assignmentLink: `${baseUrl}/dashboard/assignments/${assignment.id}`,
          },
          entityType: 'assignment',
          entityId: assignment.id,
          priority: 7, // High priority
        });

        queued++;
      } catch (notificationError) {
        logError(
          `Failed to queue overdue alert for assignment ${assignment.id}`,
          notificationError instanceof Error ? notificationError : new Error('Unknown error'),
          {
            assignment_id: assignment.id,
            student_id: assignment.student_id,
          }
        );
        failed++;
      }
    }

    const duration = Date.now() - startTime;

    logCronComplete('assignment-overdue-check', duration, {
      assignments_found: assignments.length,
      queued,
      failed,
    });

    return NextResponse.json({
      success: true,
      queued,
      failed,
      total: assignments.length,
    });
  } catch (error) {
    logCronError(
      'assignment-overdue-check',
      error instanceof Error ? error : new Error('Unknown error')
    );

    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 200 }
    );
  }
}
