/**
 * Cron Job: Lesson Reminders
 *
 * Runs daily at 10 AM to find lessons happening in the next 24 hours
 * and queue reminder notifications for students.
 *
 * Schedule: Daily at 10:00 AM
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
    logCronStart('lesson-reminders');

    const supabase = createAdminClient();

    // Find lessons scheduled between 23-25 hours from now (targeting 24h reminder)
    const now = new Date();
    const startWindow = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const endWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const { data: lessons, error } = await supabase
      .from('lessons')
      .select(`
        id,
        scheduled_at,
        title,
        notes,
        student_id,
        teacher_id,
        student_profile:profiles!lessons_student_id_fkey(id, email, full_name),
        teacher_profile:profiles!lessons_teacher_id_fkey(id, email, full_name)
      `)
      .eq('status', 'SCHEDULED')
      .gte('scheduled_at', startWindow.toISOString())
      .lte('scheduled_at', endWindow.toISOString());

    if (error) {
      logCronError(
        'lesson-reminders',
        error instanceof Error ? error : new Error('Failed to fetch lessons')
      );
      return NextResponse.json(
        { success: false, error: 'Failed to fetch lessons' },
        { status: 200 }
      );
    }

    if (!lessons || lessons.length === 0) {
      logCronComplete('lesson-reminders', Date.now() - startTime, {
        lessons_found: 0,
      });
      return NextResponse.json({
        success: true,
        message: 'No lessons to remind',
        count: 0,
      });
    }

    let queued = 0;
    let failed = 0;

    // Queue a reminder for each lesson
    for (const lesson of lessons) {
      try {
        const lessonDate = new Date(lesson.scheduled_at);
        const lessonDateFormatted = lessonDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const lessonTime = lessonDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        await queueNotification({
          type: 'lesson_reminder_24h',
          recipientUserId: lesson.student_id,
          templateData: {
            studentName: lesson.student_profile?.full_name || 'Student',
            teacherName: lesson.teacher_profile?.full_name || 'Your Teacher',
            lessonDate: lessonDateFormatted,
            lessonTime: lessonTime,
            lessonTitle: lesson.title || undefined,
            lessonNotes: lesson.notes || undefined,
          },
          entityType: 'lesson',
          entityId: lesson.id,
          priority: 7, // High priority
        });

        queued++;
      } catch (notificationError) {
        logError(
          `Failed to queue reminder for lesson ${lesson.id}`,
          notificationError instanceof Error ? notificationError : new Error('Unknown error'),
          {
            lesson_id: lesson.id,
            student_id: lesson.student_id,
          }
        );
        failed++;
      }
    }

    const duration = Date.now() - startTime;

    logCronComplete('lesson-reminders', duration, {
      lessons_found: lessons.length,
      queued,
      failed,
    });

    return NextResponse.json({
      success: true,
      queued,
      failed,
      total: lessons.length,
    });
  } catch (error) {
    logCronError(
      'lesson-reminders',
      error instanceof Error ? error : new Error('Unknown error')
    );

    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 200 }
    );
  }
}
