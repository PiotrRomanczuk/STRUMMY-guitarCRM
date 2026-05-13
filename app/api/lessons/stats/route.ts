import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { LessonStatusEnum } from '@/schemas';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  return withApiAuth(request, async () => {
    try {
      const supabase = await createClient();
      const { searchParams } = new URL(request.url);

      const userId = searchParams.get('userId');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      // Helper to build query (RLS policies handle admin access)
      const buildQuery = () => {
        let q = supabase.from('lessons').select('*', { count: 'exact', head: true });
        if (userId) {
          q = q.or(`student_id.eq.${userId},teacher_id.eq.${userId}`);
        }
        if (dateFrom) {
          q = q.gte('scheduled_at', dateFrom);
        }
        if (dateTo) {
          q = q.lte('scheduled_at', dateTo);
        }
        return q;
      };

      // Get total lessons count
      const { count: totalLessons, error: totalError } = await buildQuery();

      if (totalError) {
        logger.error('[LessonStats] Error getting total lessons:', totalError);
        return NextResponse.json({ error: totalError.message }, { status: 500 });
      }

      // Get lessons by status
      const statusStats: { [key: string]: number } = {};
      for (const status of LessonStatusEnum.options) {
        const { count, error } = await buildQuery().eq('status', status);
        if (!error) {
          statusStats[status] = count || 0;
        }
      }

      // Get lessons by month (last 12 months)
      const monthlyStats = [];
      const currentDate = new Date();
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthStart = monthDate.toISOString();
        const monthEnd = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          0
        ).toISOString();

        const { count, error } = await buildQuery()
          .gte('scheduled_at', monthStart)
          .lte('scheduled_at', monthEnd);

        if (!error) {
          monthlyStats.push({
            month: monthDate.toISOString().slice(0, 7), // YYYY-MM format
            count: count || 0,
          });
        }
      }

      // Get lessons with songs count
      const { data: lessonsWithSongs, error: songsError } = await supabase
        .from('lesson_songs')
        .select('lesson_id');

      const uniqueLessonsWithSongs = songsError
        ? 0
        : new Set(lessonsWithSongs?.map((ls: { lesson_id: string }) => ls.lesson_id) || []).size;

      // Get average lessons per student (if userId not specified)
      let avgLessonsPerStudent = 0;
      if (!userId) {
        const { data: studentStats, error: studentError } = await supabase
          .from('lessons')
          .select('student_id');

        let studentCount = 0;
        if (!studentError && studentStats) {
          studentCount = new Set(studentStats.map((l: { student_id: string }) => l.student_id))
            .size;
        }
        avgLessonsPerStudent = studentCount > 0 ? (totalLessons || 0) / studentCount : 0;
      }

      // Get upcoming lessons (scheduled for future)
      const { count: upcomingLessons } = await buildQuery()
        .eq('status', 'SCHEDULED')
        .gte('scheduled_at', new Date().toISOString());

      // Get completed lessons this month
      const currentMonthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ).toISOString();
      const { count: completedThisMonth } = await buildQuery()
        .eq('status', 'COMPLETED')
        .gte('scheduled_at', currentMonthStart);

      const stats = {
        total: totalLessons || 0,
        byStatus: statusStats,
        monthly: monthlyStats,
        lessonsWithSongs: uniqueLessonsWithSongs,
        avgLessonsPerStudent: Math.round(avgLessonsPerStudent * 100) / 100,
        upcoming: upcomingLessons || 0,
        completedThisMonth: completedThisMonth || 0,
        dateRange: {
          from: dateFrom || null,
          to: dateTo || null,
        },
      };

      return NextResponse.json(stats);
    } catch (error) {
      logger.error('[LessonStats] Internal error:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  });
}
