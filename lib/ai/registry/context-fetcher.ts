/**
 * Agent Context Data Fetchers
 *
 * Utilities for fetching context data required by agents.
 * All queries use the RLS-enforced Supabase client from createClient(),
 * so access is scoped to the authenticated user's permissions. [BMS-112]
 */

import { createClient } from '@/lib/supabase/server';
import type { AgentContext } from './types';
import { logger } from '@/lib/logger';

// Helper type for the Supabase client returned by createClient()
type SupabaseClientType = Awaited<ReturnType<typeof createClient>>;

/**
 * Fetch context data based on context key
 */
export async function fetchContextData(contextKey: string, context: AgentContext): Promise<unknown> {
  const supabase = await createClient();

  switch (contextKey) {
    case 'currentUser':
      return await fetchCurrentUser(supabase, context.userId);

    case 'currentStudent':
      return await fetchCurrentStudent(supabase, context);

    case 'recentLessons':
      return await fetchRecentLessons(supabase, context);

    case 'studentData':
      return await fetchStudentData(supabase, context);

    case 'lessonHistory':
      return await fetchLessonHistory(supabase, context);

    case 'assignmentHistory':
      return await fetchAssignmentHistory(supabase, context);

    case 'assignmentSong':
      return await fetchAssignmentSong(supabase, context);

    case 'lessonDetails':
      return await fetchLessonDetails(supabase, context);

    case 'schoolStats':
      return await fetchSchoolStats(supabase);

    case 'enrollmentData':
      return await fetchEnrollmentData(supabase);

    case 'revenueData':
      return await fetchRevenueData(supabase);

    case 'studentLessons':
      return await fetchStudentLessons(supabase, context);

    case 'studentAssignments':
      return await fetchStudentAssignments(supabase, context);

    case 'studentRepertoire':
      return await fetchStudentRepertoire(supabase, context);

    default:
      throw new Error(`Unknown context key: ${contextKey}`);
  }
}

/**
 * Fetch current user profile
 */
async function fetchCurrentUser(supabase: SupabaseClientType, userId: string) {
  const { data: user, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, is_admin, is_teacher, is_student, is_active, student_status, avatar_url, phone, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }

  return user;
}

/**
 * Fetch current student data
 */
async function fetchCurrentStudent(supabase: SupabaseClientType, context: AgentContext) {
  if (context.entityType === 'student' && context.entityId) {
    const { data: student, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_student, is_active, student_status, avatar_url, phone, created_at, updated_at')
      .eq('id', context.entityId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch student: ${error.message}`);
    }

    return student;
  }
  return null;
}

/**
 * Fetch recent lessons
 */
async function fetchRecentLessons(supabase: SupabaseClientType, context: AgentContext) {
  // RLS enforces access; additionally scope by userId when available [BMS-112]
  let query = supabase
    .from('lessons')
    .select('id, student_id, teacher_id, scheduled_at, duration_minutes, status, notes, created_at')
    .order('scheduled_at', { ascending: false })
    .limit(5);

  if (context.userId) {
    query = query.eq('teacher_id', context.userId);
  }

  const { data: lessons, error } = await query;

  if (error) {
    logger.warn('[ContextFetcher] Failed to fetch recent lessons', { error: error.message });
    return [];
  }

  return lessons || [];
}

/**
 * Fetch student data for analysis
 */
async function fetchStudentData(supabase: SupabaseClientType, context: AgentContext) {
  // Fetch multiple students if specified in context
  const studentIds = context.contextData.studentIds as string[] | undefined;
  if (studentIds) {
    const { data: students, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_student, is_active, student_status, avatar_url, phone, created_at, updated_at')
      .in('id', studentIds);

    if (error) {
      throw new Error(`Failed to fetch student data: ${error.message}`);
    }

    return students || [];
  }

  return [];
}

/**
 * Fetch lesson history
 */
async function fetchLessonHistory(supabase: SupabaseClientType, context: AgentContext) {
  let query = supabase
    .from('lessons')
    .select('id, student_id, teacher_id, scheduled_at, duration_minutes, status, notes, created_at')
    .order('scheduled_at', { ascending: false })
    .limit(20);

  if (context.userId) {
    query = query.eq('teacher_id', context.userId);
  }

  const { data: lessons, error } = await query;

  if (error) {
    logger.warn('[ContextFetcher] Failed to fetch lesson history', { error: error.message });
    return [];
  }

  return lessons || [];
}

/**
 * Fetch assignment history
 */
async function fetchAssignmentHistory(supabase: SupabaseClientType, context: AgentContext) {
  let query = supabase
    .from('assignments')
    .select('id, student_id, teacher_id, title, description, status, due_date, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (context.userId) {
    query = query.eq('teacher_id', context.userId);
  }

  const { data: assignments, error } = await query;

  if (error) {
    logger.warn('[ContextFetcher] Failed to fetch assignment history', { error: error.message });
    return [];
  }

  return assignments || [];
}

/**
 * Fetch assignment song details
 */
async function fetchAssignmentSong(supabase: SupabaseClientType, context: AgentContext) {
  const songInfo = context.contextData.songInfo as { title?: string } | undefined;
  if (songInfo?.title) {
    const { data: song, error } = await supabase
      .from('songs')
      .select('id, title, author, level, key, chords, tempo, capo_fret, strumming_pattern, category, lyrics_with_chords, youtube_url, ultimate_guitar_link, spotify_link_url, created_at')
      .eq('title', songInfo.title)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.warn(`Song not found: ${songInfo.title}`);
    }

    return song;
  }

  return null;
}

/**
 * Fetch lesson details
 */
async function fetchLessonDetails(supabase: SupabaseClientType, context: AgentContext) {
  if (context.entityType === 'lesson' && context.entityId) {
    const { data: lesson, error } = await supabase
      .from('lessons')
      .select('id, student_id, teacher_id, scheduled_at, duration_minutes, status, notes, created_at, updated_at')
      .eq('id', context.entityId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch lesson details: ${error.message}`);
    }

    return lesson;
  }

  return null;
}

/**
 * Fetch school statistics
 */
async function fetchSchoolStats(supabase: SupabaseClientType) {
  try {
    const [usersResult, lessonsResult, songsResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('lessons').select('id', { count: 'exact', head: true }),
      supabase.from('songs').select('id', { count: 'exact', head: true }),
    ]);

    return {
      totalUsers: usersResult.count || 0,
      totalLessons: lessonsResult.count || 0,
      totalSongs: songsResult.count || 0,
    };
  } catch (error) {
    logger.warn('Failed to fetch school stats', { error: String(error) });
    return { totalUsers: 0, totalLessons: 0, totalSongs: 0 };
  }
}

/**
 * Fetch enrollment data
 */
async function fetchEnrollmentData(supabase: SupabaseClientType) {
  try {
    const { data: recentUsers, error } = await supabase
      .from('profiles')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error(`Failed to fetch enrollment data: ${error.message}`);
    }

    return recentUsers || [];
  } catch (error) {
    logger.warn('Failed to fetch enrollment data', { error: String(error) });
    return [];
  }
}

/**
 * Fetch revenue data (placeholder - implement based on your billing system)
 */
async function fetchRevenueData(_supabase: SupabaseClientType) {
  // Not yet implemented — return null so agents know data is unavailable [BMS-116]
  return null;
}

/**
 * Fetch lessons scoped to a specific student (last 5)
 */
async function fetchStudentLessons(supabase: SupabaseClientType, context: AgentContext) {
  if (context.entityType !== 'student' || !context.entityId) {
    return [];
  }

  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, title, scheduled_at, notes, status')
    .eq('student_id', context.entityId)
    .order('scheduled_at', { ascending: false })
    .limit(5);

  if (error) {
    logger.warn('[ContextFetcher] Failed to fetch student lessons', { error: error.message });
    return [];
  }

  return lessons || [];
}

/**
 * Fetch assignments scoped to a specific student
 */
async function fetchStudentAssignments(supabase: SupabaseClientType, context: AgentContext) {
  if (context.entityType !== 'student' || !context.entityId) {
    return [];
  }

  const { data: assignments, error } = await supabase
    .from('assignments')
    .select('id, title, description, status, due_date')
    .eq('student_id', context.entityId)
    .order('due_date', { ascending: true })
    .limit(10);

  if (error) {
    logger.warn('[ContextFetcher] Failed to fetch student assignments', { error: error.message });
    return [];
  }

  return assignments || [];
}

/**
 * Fetch repertoire (songs + statuses) scoped to a specific student
 */
async function fetchStudentRepertoire(supabase: SupabaseClientType, context: AgentContext) {
  if (context.entityType !== 'student' || !context.entityId) {
    return [];
  }

  const { data, error } = await supabase
    .from('lesson_songs')
    .select(
      `
      status,
      created_at,
      songs (
        id,
        title,
        author
      ),
      lessons!inner (
        student_id,
        scheduled_at
      )
    `
    )
    .eq('lessons.student_id', context.entityId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.warn('[ContextFetcher] Failed to fetch student repertoire', { error: error.message });
    return [];
  }

  if (!data) return [];

  // Deduplicate by song, keeping most recent status
  const songMap = new Map<string, { title: string; author: string; status: string }>();
  for (const item of data) {
    // Supabase join may return array or single object
    const rawSong = item.songs;
    const song = Array.isArray(rawSong)
      ? (rawSong[0] as { id: string; title: string; author: string } | undefined)
      : (rawSong as { id: string; title: string; author: string } | null);
    if (song && !songMap.has(song.id)) {
      songMap.set(song.id, {
        title: song.title,
        author: song.author,
        status: item.status,
      });
    }
  }

  return Array.from(songMap.values());
}
