import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  return withApiAuth(request, async ({ user, roles }) => {
    try {
      const supabase = await createClient();
      const { searchParams } = new URL(request.url);

      const teacherId = searchParams.get('teacherId');
      const studentId = searchParams.get('studentId');
      const period = searchParams.get('period') || 'month'; // week, month, quarter, year
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      // Build base query for lessons
      let baseQuery = supabase
        .from('lessons')
        .select('id, status, scheduled_at, teacher_id, student_id');

      // Role-based filtering: teachers see only their own, students see only their own
      if (roles.isAdmin) {
        // Admins can filter by any teacherId/studentId
        if (teacherId) {
          baseQuery = baseQuery.eq('teacher_id', teacherId);
        }
        if (studentId) {
          baseQuery = baseQuery.eq('student_id', studentId);
        }
      } else if (roles.isTeacher) {
        // Teachers can only see their own lessons — ignore teacherId param
        baseQuery = baseQuery.eq('teacher_id', user.id);
        if (studentId) {
          baseQuery = baseQuery.eq('student_id', studentId);
        }
      } else if (roles.isStudent) {
        // Students can only see their own lessons
        baseQuery = baseQuery.eq('student_id', user.id);
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (dateFrom) {
        baseQuery = baseQuery.gte('scheduled_at', dateFrom);
      }

      if (dateTo) {
        baseQuery = baseQuery.lte('scheduled_at', dateTo);
      }

      // Get lesson completion rates
      const { data: allLessons, error: lessonsError } = await baseQuery;
      if (lessonsError) {
        logger.error('Error fetching lessons for analytics:', lessonsError);
        return NextResponse.json({ error: lessonsError.message }, { status: 500 });
      }

      const totalLessons = allLessons?.length || 0;
      const completedLessons =
        allLessons?.filter((l: { status: string }) => l.status === 'COMPLETED').length || 0;
      const cancelledLessons =
        allLessons?.filter((l: { status: string }) => l.status === 'CANCELLED').length || 0;
      const completionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      // Get average lesson duration
      const { data: lessonDurations, error: durationError } = await supabase
        .from('lesson_durations')
        .select('duration');

      let avgDuration = 0;
      if (!durationError && lessonDurations) {
        const totalDuration = lessonDurations.reduce(
          (sum: number, ld: { duration?: number }) => sum + (ld.duration || 0),
          0
        );
        avgDuration = lessonDurations.length > 0 ? totalDuration / lessonDurations.length : 0;
      }

      // Get student progress analytics
      const { data: studentProgress, error: progressError } = await supabase.from('lesson_songs')
        .select(`
        status,
        songs(level, key),
        lesson:lessons(scheduled_at, status)
      `);

      let progressAnalytics = {
        songsStarted: 0,
        songsMastered: 0,
        averageProgress: 0,
        levelDistribution: {},
      };

      if (!progressError && studentProgress) {
        const statusCounts = studentProgress.reduce(
          (acc: { [key: string]: number }, sp: { status: string }) => {
            acc[sp.status] = (acc[sp.status] || 0) + 1;
            return acc;
          },
          {}
        );

        progressAnalytics = {
          songsStarted: statusCounts.started || 0,
          songsMastered: statusCounts.mastered || 0,
          averageProgress:
            studentProgress.length > 0
              ? ((statusCounts.mastered || 0) / studentProgress.length) * 100
              : 0,
          levelDistribution: (studentProgress as { songs?: { level?: string } }[]).reduce(
            (acc: { [key: string]: number }, sp: { songs?: { level?: string } }) => {
              const level = sp.songs?.level || 'unknown';
              acc[level] = (acc[level] || 0) + 1;
              return acc;
            },
            {}
          ),
        };
      }

      // Get teacher performance metrics
      const { data: teacherMetrics, error: teacherError } = await supabase.from('lessons').select(`
        teacher_id,
        status,
        profile:profiles!lessons_teacher_id_fkey(email, first_name, last_name)
      `);

      let teacherPerformance: {
        [key: string]: {
          totalLessons: number;
          completedLessons: number;
          completionRate: number;
          teacher: { email?: string; first_name?: string; last_name?: string };
        };
      } = {};
      if (!teacherError && teacherMetrics) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        teacherPerformance = (teacherMetrics as any[]).reduce(
          (
            acc: {
              [key: string]: {
                totalLessons: number;
                completedLessons: number;
                completionRate: number;
                teacher: {
                  email?: string;
                  first_name?: string;
                  last_name?: string;
                };
              };
            },
            lesson: {
              teacher_id: string;
              status: string;
              profile: { email?: string; first_name?: string; last_name?: string };
            }
          ) => {
            const tid = lesson.teacher_id;
            if (!acc[tid]) {
              acc[tid] = {
                totalLessons: 0,
                completedLessons: 0,
                completionRate: 0,
                teacher: lesson.profile,
              };
            }
            acc[tid].totalLessons++;
            if (lesson.status === 'COMPLETED') {
              acc[tid].completedLessons++;
            }
            acc[tid].completionRate = (acc[tid].completedLessons / acc[tid].totalLessons) * 100;
            return acc;
          },
          {}
        );
      }

      // Get time-based analytics
      const { data: timeAnalytics, error: timeError } = await supabase
        .from('lessons')
        .select('scheduled_at, status');

      const timeBasedAnalytics = {
        peakHours: {} as { [key: string]: number },
        weeklyDistribution: {} as { [key: string]: number },
        monthlyTrends: {} as { [key: string]: number },
      };

      if (!timeError && timeAnalytics) {
        // Analyze peak hours
        timeAnalytics.forEach((lesson: { scheduled_at?: string }) => {
          if (lesson.scheduled_at) {
            const hour = new Date(lesson.scheduled_at).getHours().toString().padStart(2, '0');
            timeBasedAnalytics.peakHours[hour] = (timeBasedAnalytics.peakHours[hour] || 0) + 1;
          }
        });

        // Analyze weekly distribution
        timeAnalytics.forEach((lesson: { scheduled_at?: string }) => {
          if (lesson.scheduled_at) {
            const dayOfWeek = new Date(lesson.scheduled_at).getDay();
            const dayNames = [
              'Sunday',
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
            ];
            const dayName = dayNames[dayOfWeek];
            timeBasedAnalytics.weeklyDistribution[dayName] =
              (timeBasedAnalytics.weeklyDistribution[dayName] || 0) + 1;
          }
        });
      }

      const analytics = {
        overview: {
          totalLessons,
          completedLessons,
          cancelledLessons,
          completionRate: Math.round(completionRate * 100) / 100,
          averageDuration: Math.round(avgDuration * 100) / 100,
        },
        progress: progressAnalytics,
        teacherPerformance,
        timeAnalytics: timeBasedAnalytics,
        filters: {
          teacherId,
          studentId,
          period,
          dateFrom,
          dateTo,
        },
      };

      return NextResponse.json(analytics);
    } catch (error) {
      logger.error('Error in lesson analytics API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
