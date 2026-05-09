import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import type { NotificationAnalytics, NotificationType } from '@/types/notifications';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/notification-analytics
 * Fetch notification analytics data for admin dashboard
 *
 * Query params:
 * - days: Number of days to look back (7, 30, or 90)
 */
export async function GET(request: NextRequest) {
  return withApiAuth(
    request,
    async () => {
      try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const days = parseInt(searchParams.get('days') || '30');

        if (![7, 30, 90].includes(days)) {
          return NextResponse.json({ error: 'Invalid days parameter' }, { status: 400 });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: logs, error: logsError } = await supabase
          .from('notification_log')
          .select('id, status, notification_type, created_at')
          .gte('created_at', startDate.toISOString());

        if (logsError) {
          logger.error('Error fetching notification logs:', logsError);
          return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
        }

        const totalLogs = logs || [];
        const totalSent = totalLogs.length;

        const sentCount = totalLogs.filter((log) => log.status === 'sent').length;
        const failedCount = totalLogs.filter((log) => log.status === 'failed').length;
        const bouncedCount = totalLogs.filter((log) => log.status === 'bounced').length;
        const skippedCount = totalLogs.filter((log) => log.status === 'skipped').length;

        const successRate = totalSent > 0 ? (sentCount / totalSent) * 100 : 0;
        const failureRate = totalSent > 0 ? (failedCount / totalSent) * 100 : 0;
        const bounceRate = totalSent > 0 ? (bouncedCount / totalSent) * 100 : 0;
        const optOutRate = totalSent > 0 ? (skippedCount / totalSent) * 100 : 0;

        const sentByType: Record<NotificationType, number> = totalLogs.reduce(
          (acc, log) => {
            acc[log.notification_type as NotificationType] =
              (acc[log.notification_type as NotificationType] || 0) + 1;
            return acc;
          },
          {} as Record<NotificationType, number>
        );

        const sentByDay = totalLogs.reduce(
          (acc, log) => {
            const date = new Date(log.created_at).toISOString().split('T')[0];
            const existing = acc.find(
              (item: { date: string; count: number }) => item.date === date
            );
            if (existing) {
              existing.count++;
            } else {
              acc.push({ date, count: 1 });
            }
            return acc;
          },
          [] as Array<{ date: string; count: number }>
        );

        sentByDay.sort((a: { date: string; count: number }, b: { date: string; count: number }) =>
          a.date.localeCompare(b.date)
        );

        const analytics: NotificationAnalytics = {
          totalSent,
          successRate: Math.round(successRate * 100) / 100,
          failureRate: Math.round(failureRate * 100) / 100,
          bounceRate: Math.round(bounceRate * 100) / 100,
          optOutRate: Math.round(optOutRate * 100) / 100,
          sentByType,
          sentByDay,
        };

        return NextResponse.json(analytics, { status: 200 });
      } catch (error) {
        logger.error('Error in notification analytics API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    },
    { requiredRole: 'admin' }
  );
}
