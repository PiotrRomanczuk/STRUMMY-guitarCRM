import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * GET /api/dashboard/stats
 * Returns dashboard statistics based on user role
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check roles
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_teacher, is_student')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Admin stats
    if (profile.is_admin) {
      const [
        { count: totalUsers },
        { count: totalTeachers },
        { count: totalStudents },
        { count: activeStudents },
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
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_student', true)
          .eq('student_status', 'active'),
        supabase.from('songs').select('*', { count: 'exact', head: true }),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
      ]);

      return NextResponse.json({
        role: 'admin',
        stats: {
          totalUsers: totalUsers || 0,
          totalTeachers: totalTeachers || 0,
          totalStudents: totalStudents || 0,
          activeStudents: activeStudents || 0,
          totalSongs: totalSongs || 0,
          totalLessons: totalLessons || 0,
        },
      });
    } // Teacher stats
    if (profile.is_teacher) {
      const [
        { count: myStudents },
        { count: activeLessons },
        { count: songsLibrary },
        { count: totalAssignments },
        { count: completedAssignments },
      ] = await Promise.all([
        supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user.id),
        supabase
          .from('lessons')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user.id)
          .eq('status', 'IN_PROGRESS'),
        supabase.from('songs').select('*', { count: 'exact', head: true }),
        supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user.id),
        supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .eq('teacher_id', user.id)
          .eq('status', 'completed'),
      ]);

      const studentProgress =
        totalAssignments && totalAssignments > 0
          ? Math.round(((completedAssignments || 0) / totalAssignments) * 100)
          : 0;

      return NextResponse.json({
        role: 'teacher',
        stats: {
          myStudents: myStudents || 0,
          activeLessons: activeLessons || 0,
          songsLibrary: songsLibrary || 0,
          studentProgress,
        },
      });
    }

    // Student stats
    if (profile.is_student) {
      // Get lessons for this student
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, teacher_id, lesson_teacher_number')
        .eq('student_id', user.id);

      const lessonIds = lessons?.map((l) => l.id) || [];

      // Get song status counts for these lessons
      const [
        { count: songsLearning },
        { count: completedSongs },
        { count: totalAssigned },
        { count: completedStudentAssignments },
        { count: totalStudentAssignments },
      ] = await Promise.all([
        supabase
          .from('lesson_songs')
          .select('*', { count: 'exact', head: true })
          .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['']),
        supabase
          .from('lesson_songs')
          .select('*', { count: 'exact', head: true })
          .in('lesson_id', lessonIds.length > 0 ? lessonIds : [''])
          .eq('status', 'completed'),
        supabase
          .from('lesson_songs')
          .select('*', { count: 'exact', head: true })
          .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['']),
        supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .eq('status', 'completed'),
        supabase
          .from('assignments')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', user.id),
      ]);

      const uniqueTeachers = new Set(lessons?.map((l) => l.teacher_id)).size;
      const lessonsDone = lessons?.length || 0;

      // Calculate progress from completed songs and assignments
      const totalItems = (totalAssigned || 0) + (totalStudentAssignments || 0);
      const completedItems = (completedSongs || 0) + (completedStudentAssignments || 0);
      const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return NextResponse.json({
        role: 'student',
        stats: {
          myTeacher: uniqueTeachers || 0,
          lessonsDone: lessonsDone,
          songsLearning: songsLearning || 0,
          progress,
        },
      });
    }

    return NextResponse.json({
      role: 'user',
      stats: {},
    });
  } catch (error) {
    logger.error('[API /api/dashboard/stats] ERROR:', error);
    logger.error(
      '[API /api/dashboard/stats] Error stack:',
      error instanceof Error ? error.stack : 'No stack trace'
    );
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
