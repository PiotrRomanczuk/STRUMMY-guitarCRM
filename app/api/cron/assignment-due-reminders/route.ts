/**
 * Cron Job: Assignment Due Reminders
 *
 * Runs daily at 9 AM to find assignments due in 2 days
 * and queue reminder notifications for students.
 *
 * Schedule: Daily at 9:00 AM
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
    logCronStart('assignment-due-reminders');

    const supabase = createAdminClient();

    // Find assignments due in approximately 2 days (47-49 hours from now)
    const now = new Date();
    const startWindow = new Date(now.getTime() + 47 * 60 * 60 * 1000);
    const endWindow = new Date(now.getTime() + 49 * 60 * 60 * 1000);

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        id,
        title,
        description,
        due_date,
        student_id,
        student_profile:profiles!assignments_student_id_fkey(id, email, full_name)
      `)
      .in('status', ['not_started', 'in_progress'])
      .gte('due_date', startWindow.toISOString())
      .lte('due_date', endWindow.toISOString());

    if (error) {
      logCronError(
        'assignment-due-reminders',
        error instanceof Error ? error : new Error('Failed to fetch assignments')
      );
      return NextResponse.json(
        { success: false, error: 'Failed to fetch assignments' },
        { status: 200 }
      );
    }

    if (!assignments || assignments.length === 0) {
      logCronComplete('assignment-due-reminders', Date.now() - startTime, {
        assignments_found: 0,
      });
      return NextResponse.json({
        success: true,
        message: 'No assignments to remind',
        count: 0,
      });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL_REMOTE ||
      'https://example.com';

    let queued = 0;
    let failed = 0;

    // Queue a reminder for each assignment
    for (const assignment of assignments) {
      try {
        const dueDate = new Date(assignment.due_date!);
        const dueDateFormatted = dueDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        await queueNotification({
          type: 'assignment_due_reminder',
          recipientUserId: assignment.student_id,
          templateData: {
            studentName: assignment.student_profile?.full_name || 'Student',
            assignmentTitle: assignment.title,
            dueDate: dueDateFormatted,
            assignmentDescription: assignment.description || undefined,
            assignmentLink: `${baseUrl}/dashboard/assignments/${assignment.id}`,
          },
          entityType: 'assignment',
          entityId: assignment.id,
          priority: 6,
        });

        queued++;
      } catch (notificationError) {
        logError(
          `Failed to queue reminder for assignment ${assignment.id}`,
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

    logCronComplete('assignment-due-reminders', duration, {
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
      'assignment-due-reminders',
      error instanceof Error ? error : new Error('Unknown error')
    );

    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 200 }
    );
  }
}
