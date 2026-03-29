/**
 * AI Agent Tools
 *
 * Tools that AI agents can call to query the database, look up songs,
 * and perform operations. Used with Vercel AI SDK's tool() primitive.
 */

import { z } from 'zod';
import { tool } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Look up songs in the catalog by title, artist, or difficulty level
 */
export const lookupSong = tool({
  description:
    'Search the song catalog by title, artist, or difficulty level. Returns matching songs with metadata.',
  inputSchema: z.object({
    query: z.string().describe('Search query (song title or artist name)'),
    level: z.string().optional().describe('Filter by difficulty: beginner, intermediate, advanced'),
    limit: z.number().optional().default(5).describe('Max results to return'),
  }),
  execute: async ({ query, level, limit }) => {
    try {
      const supabase = await createClient();
      let dbQuery = supabase
        .from('songs')
        .select('id, title, author, level, key, chords, tempo, strumming_pattern, capo_fret')
        .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
        .limit(limit ?? 5);

      if (level) {
        dbQuery = dbQuery.eq('level', level);
      }

      const { data, error } = await dbQuery;
      if (error) return { error: error.message };
      return { songs: data ?? [], count: data?.length ?? 0 };
    } catch (err) {
      logger.error('[AI Tool] lookupSong error:', err);
      return { error: 'Failed to search songs' };
    }
  },
});

/**
 * Get a student's profile and current status
 */
export const getStudentInfo = tool({
  description: 'Get student profile information including name, email, level, and enrollment date.',
  inputSchema: z.object({
    studentId: z.string().optional().describe('Student UUID. If not provided, search by name.'),
    name: z.string().optional().describe('Student name to search for'),
  }),
  execute: async ({ studentId, name }) => {
    try {
      const supabase = await createClient();

      if (studentId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, created_at')
          .eq('id', studentId)
          .single();

        if (error) return { error: error.message };
        return { student: data };
      }

      if (name) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role, created_at')
          .ilike('full_name', `%${name}%`)
          .eq('role', 'student')
          .limit(5);

        if (error) return { error: error.message };
        return { students: data ?? [], count: data?.length ?? 0 };
      }

      return { error: 'Provide either studentId or name' };
    } catch (err) {
      logger.error('[AI Tool] getStudentInfo error:', err);
      return { error: 'Failed to look up student' };
    }
  },
});

/**
 * Get a student's recent lesson history
 */
export const getStudentLessonHistory = tool({
  description: 'Get recent lessons for a student, including dates, notes, and songs covered.',
  inputSchema: z.object({
    studentId: z.string().describe('Student UUID'),
    limit: z.number().optional().default(10).describe('Number of recent lessons to return'),
  }),
  execute: async ({ studentId, limit }) => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('lessons')
        .select('id, date, notes, created_at')
        .eq('student_id', studentId)
        .order('date', { ascending: false })
        .limit(limit ?? 10);

      if (error) return { error: error.message };
      return { lessons: data ?? [], count: data?.length ?? 0 };
    } catch (err) {
      logger.error('[AI Tool] getStudentLessonHistory error:', err);
      return { error: 'Failed to fetch lesson history' };
    }
  },
});

/**
 * Get a student's song repertoire with statuses
 */
export const getSongRepertoire = tool({
  description: 'Get the songs a student is currently learning or has mastered.',
  inputSchema: z.object({
    studentId: z.string().describe('Student UUID'),
  }),
  execute: async ({ studentId }) => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('student_repertoire')
        .select('id, song_id, current_status, is_active, songs(title, author, level)')
        .eq('student_id', studentId)
        .eq('is_active', true);

      if (error) return { error: error.message };
      return { repertoire: data ?? [], count: data?.length ?? 0 };
    } catch (err) {
      logger.error('[AI Tool] getSongRepertoire error:', err);
      return { error: 'Failed to fetch repertoire' };
    }
  },
});

/**
 * All tools available to AI agents, grouped for easy reference
 */
export const chatTools = {
  lookupSong,
  getStudentInfo,
  getStudentLessonHistory,
  getSongRepertoire,
};
