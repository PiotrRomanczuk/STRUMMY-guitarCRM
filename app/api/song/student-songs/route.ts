import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SongWithLessonsSchema, type SongWithLessons } from '@/schemas/SongSchema';
import { createClient } from '@/lib/supabase/server';
import { withApiAuth } from '@/lib/auth/withApiAuth';

const querySchema = z.object({
  userId: z.string().uuid(),
  level: z.string().optional(),
});

export async function GET(request: Request) {
  return withApiAuth(request, async ({ user, roles }) => {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    const level = searchParams.get('level');

    // Students can only see their own songs
    if (roles.isStudent && !roles.isAdmin && !roles.isTeacher) {
      userId = user.id;
    }

    const parseResult = querySchema.safeParse({ userId, level });
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    // Fetch assigned songs for student
    const { data, error } = await supabase
      .from('lesson_songs')
      .select('*,songs(*)')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map lesson_songs to SongWithStatus
    const mapped: SongWithLessons[] = data.map(
      (ls: { songs: SongWithLessons; status: string }) => ({
        ...ls.songs,
        status: ls.status,
      })
    );

    // Optionally filter by level
    const filtered = level ? mapped.filter((song) => song.level === level) : mapped;

    // Validate output
    const safe = SongWithLessonsSchema.array().safeParse(filtered);
    if (!safe.success) {
      return NextResponse.json({ error: 'Invalid song data' }, { status: 500 });
    }

    return NextResponse.json(safe.data);
  });
}
