/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Check if local Supabase is running - if not, clear local env vars to use remote
// Mirrors logic in playwright.config.ts and next.config.ts
if (process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL) {
  try {
    execSync('nc -z 127.0.0.1 54321 2>/dev/null', { timeout: 2000 });
  } catch {
    delete process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY;
    delete process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY;
  }
}

/**
 * Test Data Cleanup Helper
 *
 * Removes test data created during E2E tests to prevent database pollution.
 * Targets data with specific test patterns in titles/names/artists.
 */

// Test patterns to identify test data
const TEST_PATTERNS = {
  songs: {
    titles: [
      /^E2E Song \d+/,
      /^E2E Edit Test \d+/,
      /^E2E API Test Song \d+/,
      /^Teacher Song \d+/,
      /EDITED$/,
      /UPDATED$/,
    ],
    artists: [
      'E2E Test Artist',
      'Teacher Test Artist',
      /^E2E Test Artist/,
    ],
  },
  lessons: {
    titles: [
      /^E2E Lesson \d+/,
      /^E2E Teacher Lesson \d+/,
      /^Teacher Lesson \d+/,
      /^Test Lesson \d+/,
    ],
    notes: [
      'E2E Test lesson notes',
    ],
  },
  assignments: {
    titles: [
      /^E2E Assignment \d+/,
      /^Teacher Assignment \d+/,
      /^Test Assignment \d+/,
    ],
    descriptions: [
      /^E2E Test assignment description/,
    ],
  },
  assignmentTemplates: {
    titles: [
      /^E2E Template \d+/,
      /^Teacher Template \d+/,
      /^Test Template \d+/,
    ],
    descriptions: [
      /^E2E Test template description/,
    ],
  },
  users: {
    emails: [
      /^e2e\.student\.\d+@example\.com$/,
      /^e2e\.teacher\.\d+@example\.com$/,
      /^e2e\.admin\.\d+@example\.com$/,
      /^test\.\d+@example\.com$/,
    ],
    firstNames: [
      'E2ETest',
      'E2EEdited',
      /^E2E/,
    ],
  },
  pendingStudents: {
    emails: [
      /^e2e\.pending\.\d+@example\.com$/,
      /^test\.pending\.\d+@example\.com$/,
    ],
  },
  aiConversations: {
    titles: [
      /^E2E Test Conversation/,
      /^Test AI Conversation/,
    ],
  },
};

/**
 * Get Supabase admin client for cleanup operations
 * Uses service role key to bypass RLS policies
 */
function getSupabaseClient() {
  // Use local URL if available (set by playwright.config.ts only when local Supabase is running)
  // Otherwise fall back to remote URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL ||
                      process.env.NEXT_PUBLIC_SUPABASE_REMOTE_URL ||
                      process.env.NEXT_PUBLIC_SUPABASE_URL ||
                      'http://127.0.0.1:54321';

  // Prefer service role key to bypass RLS policies
  const supabaseKey = process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY ||
                      process.env.SUPABASE_REMOTE_SERVICE_ROLE_KEY ||
                      process.env.SUPABASE_SERVICE_ROLE_KEY ||
                      process.env.NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY;

  if (!supabaseKey) {
    console.error('Available env vars:', {
      hasLocalUrl: !!process.env.NEXT_PUBLIC_SUPABASE_LOCAL_URL,
      hasLocalServiceKey: !!process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasLocalKey: !!process.env.NEXT_PUBLIC_SUPABASE_LOCAL_ANON_KEY,
    });
    throw new Error('Missing Supabase credentials for cleanup. Ensure .env.local is configured.');
  }

  // Check if using service role by decoding JWT payload
  let authType = 'ANON (subject to RLS)';
  try {
    const payload = supabaseKey.split('.')[1];
    if (payload) {
      const decoded = Buffer.from(payload, 'base64').toString('utf-8');
      if (decoded.includes('service_role')) {
        authType = 'SERVICE_ROLE (bypasses RLS)';
      }
    }
  } catch {
    // If JWT decode fails, check env var name as fallback
    if (process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY === supabaseKey ||
        process.env.SUPABASE_SERVICE_ROLE_KEY === supabaseKey) {
      authType = 'SERVICE_ROLE (bypasses RLS)';
    }
  }

  console.log(`Using Supabase at: ${supabaseUrl}`);
  console.log(`Auth: ${authType}`);
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Check if a string matches any of the test patterns
 */
function matchesPattern(value: string | null, patterns: (RegExp | string)[]): boolean {
  if (!value) return false;

  return patterns.some(pattern => {
    if (typeof pattern === 'string') {
      return value === pattern;
    }
    return pattern.test(value);
  });
}

/**
 * Delete test songs from the database
 */
export async function cleanupTestSongs(): Promise<{ deleted: number; errors: any[] }> {
  const supabase = getSupabaseClient();
  let deleted = 0;
  const errors: any[] = [];

  try {
    // Fetch all songs
    const { data: songs, error: fetchError } = await supabase
      .from('songs')
      .select('id, title, author');

    if (fetchError) {
      console.error('Error fetching songs for cleanup:', fetchError);
      errors.push(fetchError);
      return { deleted, errors };
    }

    if (!songs || songs.length === 0) {
      console.log('No songs found for cleanup');
      return { deleted, errors };
    }

    // Filter songs that match test patterns
    const testSongs = songs.filter(song => {
      const titleMatches = matchesPattern(song.title, TEST_PATTERNS.songs.titles);
      const artistMatches = matchesPattern(song.author, TEST_PATTERNS.songs.artists);
      return titleMatches || artistMatches;
    });

    console.log(`Found ${testSongs.length} test songs to delete`);

    // Delete test songs
    for (const song of testSongs) {
      const { error: deleteError } = await supabase
        .from('songs')
        .delete()
        .eq('id', song.id);

      if (deleteError) {
        console.error(`Error deleting song ${song.id}:`, deleteError);
        errors.push({ song, error: deleteError });
      } else {
        deleted++;
        console.log(`Deleted test song: ${song.title}`);
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.error('Unexpected error during song cleanup:', error);
    errors.push(error);
    return { deleted, errors };
  }
}

/**
 * Delete test lessons from the database
 */
export async function cleanupTestLessons(): Promise<{ deleted: number; errors: any[] }> {
  const supabase = getSupabaseClient();
  let deleted = 0;
  const errors: any[] = [];

  try {
    const { data: lessons, error: fetchError } = await supabase
      .from('lessons')
      .select('id, title');

    if (fetchError) {
      console.error('Error fetching lessons for cleanup:', fetchError);
      errors.push(fetchError);
      return { deleted, errors };
    }

    if (!lessons || lessons.length === 0) {
      console.log('No lessons found for cleanup');
      return { deleted, errors };
    }

    const testLessons = lessons.filter(lesson =>
      matchesPattern(lesson.title, TEST_PATTERNS.lessons.titles)
    );

    console.log(`Found ${testLessons.length} test lessons to delete`);

    for (const lesson of testLessons) {
      const { error: deleteError } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lesson.id);

      if (deleteError) {
        console.error(`Error deleting lesson ${lesson.id}:`, deleteError);
        errors.push({ lesson, error: deleteError });
      } else {
        deleted++;
        console.log(`Deleted test lesson: ${lesson.title}`);
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.error('Unexpected error during lesson cleanup:', error);
    errors.push(error);
    return { deleted, errors };
  }
}

/**
 * Delete test assignments from the database
 */
export async function cleanupTestAssignments(): Promise<{ deleted: number; errors: any[] }> {
  const supabase = getSupabaseClient();
  let deleted = 0;
  const errors: any[] = [];

  try {
    const { data: assignments, error: fetchError } = await supabase
      .from('assignments')
      .select('id, title');

    if (fetchError) {
      console.error('Error fetching assignments for cleanup:', fetchError);
      errors.push(fetchError);
      return { deleted, errors };
    }

    if (!assignments || assignments.length === 0) {
      console.log('No assignments found for cleanup');
      return { deleted, errors };
    }

    const testAssignments = assignments.filter(assignment =>
      matchesPattern(assignment.title, TEST_PATTERNS.assignments.titles)
    );

    console.log(`Found ${testAssignments.length} test assignments to delete`);

    for (const assignment of testAssignments) {
      const { error: deleteError } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignment.id);

      if (deleteError) {
        console.error(`Error deleting assignment ${assignment.id}:`, deleteError);
        errors.push({ assignment, error: deleteError });
      } else {
        deleted++;
        console.log(`Deleted test assignment: ${assignment.title}`);
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.error('Unexpected error during assignment cleanup:', error);
    errors.push(error);
    return { deleted, errors };
  }
}

/**
 * Delete test assignment templates from the database
 */
export async function cleanupTestAssignmentTemplates(): Promise<{ deleted: number; errors: any[] }> {
  const supabase = getSupabaseClient();
  let deleted = 0;
  const errors: any[] = [];

  try {
    const { data: templates, error: fetchError } = await supabase
      .from('assignment_templates')
      .select('id, title, description');

    if (fetchError) {
      console.error('Error fetching assignment templates for cleanup:', fetchError);
      errors.push(fetchError);
      return { deleted, errors };
    }

    if (!templates || templates.length === 0) {
      console.log('No assignment templates found for cleanup');
      return { deleted, errors };
    }

    const testTemplates = templates.filter(template => {
      const titleMatches = matchesPattern(template.title, TEST_PATTERNS.assignmentTemplates.titles);
      const descMatches = matchesPattern(template.description, TEST_PATTERNS.assignmentTemplates.descriptions);
      return titleMatches || descMatches;
    });

    console.log(`Found ${testTemplates.length} test assignment templates to delete`);

    for (const template of testTemplates) {
      const { error: deleteError } = await supabase
        .from('assignment_templates')
        .delete()
        .eq('id', template.id);

      if (deleteError) {
        console.error(`Error deleting assignment template ${template.id}:`, deleteError);
        errors.push({ template, error: deleteError });
      } else {
        deleted++;
        console.log(`Deleted test assignment template: ${template.title}`);
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.error('Unexpected error during assignment template cleanup:', error);
    errors.push(error);
    return { deleted, errors };
  }
}

/**
 * Delete test users (profiles) from the database
 * IMPORTANT: This also cascades to delete all related data (lessons, assignments, etc.)
 */
export async function cleanupTestUsers(): Promise<{ deleted: number; errors: any[] }> {
  const supabase = getSupabaseClient();
  let deleted = 0;
  const errors: any[] = [];

  try {
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name');

    if (fetchError) {
      console.error('Error fetching profiles for cleanup:', fetchError);
      errors.push(fetchError);
      return { deleted, errors };
    }

    if (!profiles || profiles.length === 0) {
      console.log('No profiles found for cleanup');
      return { deleted, errors };
    }

    const testProfiles = profiles.filter(profile => {
      const emailMatches = matchesPattern(profile.email, TEST_PATTERNS.users.emails);
      const fullNameMatches = matchesPattern(profile.full_name, TEST_PATTERNS.users.firstNames);
      return emailMatches || fullNameMatches;
    });

    console.log(`Found ${testProfiles.length} test users to delete`);

    for (const profile of testProfiles) {
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profile.id);

      if (deleteError) {
        console.error(`Error deleting profile ${profile.id}:`, deleteError);
        errors.push({ profile, error: deleteError });
      } else {
        deleted++;
        console.log(`Deleted test user: ${profile.email}`);
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.error('Unexpected error during user cleanup:', error);
    errors.push(error);
    return { deleted, errors };
  }
}

/**
 * Delete test pending students from the database
 */
export async function cleanupTestPendingStudents(): Promise<{ deleted: number; errors: any[] }> {
  const supabase = getSupabaseClient();
  let deleted = 0;
  const errors: any[] = [];

  try {
    const { data: pendingStudents, error: fetchError } = await supabase
      .from('pending_students')
      .select('id, email');

    if (fetchError) {
      console.error('Error fetching pending students for cleanup:', fetchError);
      errors.push(fetchError);
      return { deleted, errors };
    }

    if (!pendingStudents || pendingStudents.length === 0) {
      console.log('No pending students found for cleanup');
      return { deleted, errors };
    }

    const testPendingStudents = pendingStudents.filter(student =>
      matchesPattern(student.email, TEST_PATTERNS.pendingStudents.emails)
    );

    console.log(`Found ${testPendingStudents.length} test pending students to delete`);

    for (const student of testPendingStudents) {
      const { error: deleteError } = await supabase
        .from('pending_students')
        .delete()
        .eq('id', student.id);

      if (deleteError) {
        console.error(`Error deleting pending student ${student.id}:`, deleteError);
        errors.push({ student, error: deleteError });
      } else {
        deleted++;
        console.log(`Deleted test pending student: ${student.email}`);
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.error('Unexpected error during pending student cleanup:', error);
    errors.push(error);
    return { deleted, errors };
  }
}

/**
 * Delete orphaned practice sessions (sessions without valid student/song references)
 * Note: Practice sessions are typically cleaned up via CASCADE when users are deleted
 */
export async function cleanupOrphanedPracticeSessions(): Promise<{ deleted: number; errors: any[] }> {
  const supabase = getSupabaseClient();
  let deleted = 0;
  const errors: any[] = [];

  try {
    // Find practice sessions where the student_id or song_id no longer exists
    const { data: orphanedSessions, error: fetchError } = await supabase.rpc(
      'find_orphaned_practice_sessions'
    );

    if (fetchError) {
      // If the RPC doesn't exist, skip this cleanup
      console.log('Skipping orphaned practice sessions cleanup (RPC not available)');
      return { deleted, errors };
    }

    if (!orphanedSessions || orphanedSessions.length === 0) {
      console.log('No orphaned practice sessions found');
      return { deleted, errors };
    }

    console.log(`Found ${orphanedSessions.length} orphaned practice sessions to delete`);

    for (const session of orphanedSessions) {
      const { error: deleteError } = await supabase
        .from('practice_sessions')
        .delete()
        .eq('id', session.id);

      if (deleteError) {
        console.error(`Error deleting practice session ${session.id}:`, deleteError);
        errors.push({ session, error: deleteError });
      } else {
        deleted++;
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.log('Skipping orphaned practice sessions cleanup');
    return { deleted, errors };
  }
}

/**
 * Delete orphaned student song progress (progress without valid student/song references)
 * Note: Progress records are typically cleaned up via CASCADE when users are deleted
 */
export async function cleanupOrphanedSongProgress(): Promise<{ deleted: number; errors: any[] }> {
  const supabase = getSupabaseClient();
  let deleted = 0;
  const errors: any[] = [];

  try {
    // Find progress records where the student_id or song_id no longer exists
    const { data: orphanedProgress, error: fetchError } = await supabase.rpc(
      'find_orphaned_song_progress'
    );

    if (fetchError) {
      // If the RPC doesn't exist, skip this cleanup
      console.log('Skipping orphaned song progress cleanup (RPC not available)');
      return { deleted, errors };
    }

    if (!orphanedProgress || orphanedProgress.length === 0) {
      console.log('No orphaned song progress found');
      return { deleted, errors };
    }

    console.log(`Found ${orphanedProgress.length} orphaned song progress records to delete`);

    for (const progress of orphanedProgress) {
      const { error: deleteError } = await supabase
        .from('student_repertoire')
        .delete()
        .eq('id', progress.id);

      if (deleteError) {
        console.error(`Error deleting song progress ${progress.id}:`, deleteError);
        errors.push({ progress, error: deleteError });
      } else {
        deleted++;
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.log('Skipping orphaned song progress cleanup');
    return { deleted, errors };
  }
}

/**
 * Delete test AI conversations from the database
 */
export async function cleanupTestAIConversations(): Promise<{ deleted: number; errors: any[] }> {
  const supabase = getSupabaseClient();
  let deleted = 0;
  const errors: any[] = [];

  try {
    const { data: conversations, error: fetchError } = await supabase
      .from('ai_conversations')
      .select('id, title');

    if (fetchError) {
      console.error('Error fetching AI conversations for cleanup:', fetchError);
      errors.push(fetchError);
      return { deleted, errors };
    }

    if (!conversations || conversations.length === 0) {
      console.log('No AI conversations found for cleanup');
      return { deleted, errors };
    }

    const testConversations = conversations.filter(conv =>
      matchesPattern(conv.title, TEST_PATTERNS.aiConversations.titles)
    );

    console.log(`Found ${testConversations.length} test AI conversations to delete`);

    for (const conversation of testConversations) {
      const { error: deleteError } = await supabase
        .from('ai_conversations')
        .delete()
        .eq('id', conversation.id);

      if (deleteError) {
        console.error(`Error deleting AI conversation ${conversation.id}:`, deleteError);
        errors.push({ conversation, error: deleteError });
      } else {
        deleted++;
        console.log(`Deleted test AI conversation: ${conversation.title}`);
      }
    }

    return { deleted, errors };
  } catch (error) {
    console.error('Unexpected error during AI conversation cleanup:', error);
    errors.push(error);
    return { deleted, errors };
  }
}

/**
 * Clean up all test data
 * Order matters: Delete dependent data first, then parent data
 */
export async function cleanupAllTestData(): Promise<void> {
  console.log('\n🧹 Starting test data cleanup...\n');

  // Clean up in order: dependent data first, then parent data
  const results = {
    assignmentTemplates: await cleanupTestAssignmentTemplates(),
    assignments: await cleanupTestAssignments(),
    aiConversations: await cleanupTestAIConversations(),
    songs: await cleanupTestSongs(),
    lessons: await cleanupTestLessons(),
    pendingStudents: await cleanupTestPendingStudents(),
    // Clean up users last as they cascade delete related data
    users: await cleanupTestUsers(),
    // Clean up any orphaned records that weren't caught by cascades
    orphanedPracticeSessions: await cleanupOrphanedPracticeSessions(),
    orphanedSongProgress: await cleanupOrphanedSongProgress(),
  };

  console.log('\n📊 Cleanup Summary:');
  console.log(`  Assignment Templates deleted: ${results.assignmentTemplates.deleted}`);
  console.log(`  Assignments deleted: ${results.assignments.deleted}`);
  console.log(`  AI Conversations deleted: ${results.aiConversations.deleted}`);
  console.log(`  Songs deleted: ${results.songs.deleted}`);
  console.log(`  Lessons deleted: ${results.lessons.deleted}`);
  console.log(`  Pending Students deleted: ${results.pendingStudents.deleted}`);
  console.log(`  Users deleted: ${results.users.deleted}`);
  console.log(`  Orphaned Practice Sessions deleted: ${results.orphanedPracticeSessions.deleted}`);
  console.log(`  Orphaned Song Progress deleted: ${results.orphanedSongProgress.deleted}`);

  const totalErrors = results.assignmentTemplates.errors.length +
                     results.assignments.errors.length +
                     results.aiConversations.errors.length +
                     results.songs.errors.length +
                     results.lessons.errors.length +
                     results.pendingStudents.errors.length +
                     results.users.errors.length +
                     results.orphanedPracticeSessions.errors.length +
                     results.orphanedSongProgress.errors.length;

  if (totalErrors > 0) {
    console.log(`  ⚠️  Errors encountered: ${totalErrors}`);
  } else {
    console.log('  ✅ Cleanup completed successfully\n');
  }
}
