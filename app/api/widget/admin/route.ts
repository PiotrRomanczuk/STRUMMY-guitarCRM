import { NextRequest, NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { createClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  return withApiAuth(request, async ({ user }) => {
    const userId = user.id;

    try {
      const supabase = createClient();

      // Check if user is admin via profiles table boolean flags
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('is_admin, full_name')
        .eq('id', userId)
        .single();

      const isAdmin = userProfile?.is_admin === true;

      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
      }

      // Fetch admin statistics
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      // Total counts - use profiles boolean flags for teacher/student counts
      const [
        { count: totalUsers },
        { count: totalTeachers },
        { count: totalStudents },
        { count: totalSongs },
        { count: totalLessons },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_teacher', true),
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_student', true),
        supabase.from('songs').select('*', { count: 'exact', head: true }),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
      ]);

      // Recent activity (last 30 days)
      const { count: recentLessons } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);

      const { count: recentUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);

      // Upcoming lessons (next 7 days)
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: upcomingLessons } = await supabase
        .from('lessons')
        .select(
          `
          id,
          date,
          teacher:profiles!lessons_teacher_id_fkey(full_name),
          student:profiles!lessons_student_id_fkey(full_name)
        `
        )
        .gte('date', today)
        .lte('date', nextWeek)
        .order('date', { ascending: true })
        .limit(10);

      // Recent assignments (pending)
      const { count: pendingAssignments } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['assigned', 'in_progress']);

      // Active API keys
      const { count: activeApiKeys } = await supabase
        .from('api_keys')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Most active teachers (by lesson count in last 30 days)
      const { data: activeTeachers } = await supabase
        .from('lessons')
        .select(
          `
          teacher_id,
          teacher:profiles!lessons_teacher_id_fkey(full_name)
        `
        )
        .gte('created_at', thirtyDaysAgo)
        .limit(1000);

      // Count lessons per teacher
      const teacherLessonCounts = (activeTeachers || []).reduce(
        (acc: Record<string, { name: string; count: number }>, lesson) => {
          const teacherId = (lesson as { teacher_id: string }).teacher_id;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const teacherData = (lesson as any).teacher;
          const teacherName = Array.isArray(teacherData)
            ? teacherData[0]?.full_name
            : teacherData?.full_name || 'Unknown';
          if (!acc[teacherId]) {
            acc[teacherId] = { name: teacherName, count: 0 };
          }
          acc[teacherId].count++;
          return acc;
        },
        {}
      );

      const topTeachers = Object.values(teacherLessonCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return NextResponse.json({
        user: {
          name: userProfile?.full_name || 'Admin',
          role: 'admin',
        },
        stats: {
          users: {
            total: totalUsers || 0,
            teachers: totalTeachers || 0,
            students: totalStudents || 0,
            recentNew: recentUsers || 0,
          },
          lessons: {
            total: totalLessons || 0,
            recent30Days: recentLessons || 0,
            upcoming7Days: (upcomingLessons || []).length,
          },
          assignments: {
            pending: pendingAssignments || 0,
          },
          songs: {
            total: totalSongs || 0,
          },
          apiKeys: {
            active: activeApiKeys || 0,
          },
        },
        upcomingLessons: (upcomingLessons || []).map((lesson: Record<string, unknown>) => ({
          id: lesson.id,
          date: lesson.date,
          teacher: lesson.teacher ? (lesson.teacher as { full_name: string }).full_name : 'Unknown',
          student: lesson.student ? (lesson.student as { full_name: string }).full_name : 'Unknown',
        })),
        topTeachers: topTeachers.map((teacher) => ({
          name: teacher.name,
          lessons: teacher.count,
        })),
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error fetching admin widget data:', error);
      return NextResponse.json({ error: 'Failed to fetch admin widget data.' }, { status: 500 });
    }
  });
}
