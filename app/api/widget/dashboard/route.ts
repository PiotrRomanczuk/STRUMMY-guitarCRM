/**
 * Widget Dashboard API Endpoint
 * Provides data for iOS Scriptable widget with API key authentication
 */
import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithBearerToken, extractBearerToken } from '@/lib/bearer-auth';
import { createClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  // Extract and validate bearer token
  const authHeader = request.headers.get('authorization');
  const token = extractBearerToken(authHeader ?? undefined);

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized. Bearer token required.' }, { status: 401 });
  }

  // Authenticate with API key
  const auth = await authenticateWithBearerToken(token);
  if (!auth) {
    return NextResponse.json({ error: 'Invalid or inactive API key.' }, { status: 401 });
  }

  const { userId, profile } = auth;

  try {
    const supabase = await createClient();

    // Check user roles from profiles table boolean flags
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('is_teacher, is_student')
      .eq('id', userId)
      .single();

    const isTeacher = userProfile?.is_teacher === true;
    const isStudent = userProfile?.is_student === true;

    // Fetch upcoming lessons (next 7 days)
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let lessons: unknown[] = [];
    if (isTeacher) {
      // Teacher: show lessons they're teaching
      const { data } = await supabase
        .from('lessons')
        .select(
          `
          id,
          scheduled_at,
          notes,
          student:profiles!lessons_student_id_fkey(full_name)
        `
        )
        .eq('teacher_id', userId)
        .gte('scheduled_at', today)
        .lte('scheduled_at', nextWeek)
        .order('scheduled_at', { ascending: true })
        .limit(5);
      lessons = data || [];
    } else if (isStudent) {
      // Student: show their assigned lessons
      const { data } = await supabase
        .from('lessons')
        .select(
          `
          id,
          scheduled_at,
          notes,
          teacher:profiles!lessons_teacher_id_fkey(full_name)
        `
        )
        .eq('student_id', userId)
        .gte('scheduled_at', today)
        .lte('scheduled_at', nextWeek)
        .order('scheduled_at', { ascending: true })
        .limit(5);
      lessons = data || [];
    }

    // Fetch pending assignments (for students)
    let assignments: unknown[] = [];
    if (isStudent) {
      const { data } = await supabase
        .from('assignments')
        .select(
          `
          id,
          due_date,
          status,
          song:songs(title, artist)
        `
        )
        .eq('student_id', userId)
        .in('status', ['assigned', 'in_progress'])
        .order('due_date', { ascending: true })
        .limit(5);
      assignments = data || [];
    }

    // Format response for widget
    return NextResponse.json({
      user: {
        name: profile?.full_name || 'User',
        role: isTeacher ? 'teacher' : isStudent ? 'student' : 'user',
      },
      lessons: (lessons as Record<string, unknown>[]).map((lesson) => ({
        id: lesson.id,
        date: lesson.scheduled_at,
        notes: lesson.notes,
        with:
          isTeacher && lesson.student
            ? (lesson.student as { full_name: string }).full_name
            : isStudent && lesson.teacher
              ? (lesson.teacher as { full_name: string }).full_name
              : null,
      })),
      assignments: (assignments as Record<string, unknown>[]).map((assignment) => ({
        id: assignment.id,
        dueDate: assignment.due_date,
        status: assignment.status,
        song: assignment.song
          ? `${(assignment.song as { title: string; artist: string }).title} - ${
              (assignment.song as { title: string; artist: string }).artist
            }`
          : 'Unknown',
      })),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Widget dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch widget data.' }, { status: 500 });
  }
}
