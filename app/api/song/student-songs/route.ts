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

    const parseResult = querySchema.safeParse({ userId, level: level ?? undefined });
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
    }

    // Fetch assigned songs for student via student_repertoire (lesson_songs has no student_id)
    const { data, error } = await supabase
      .from('student_repertoire')
      .select('current_status,songs(*)')
      .eq('student_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map student_repertoire to SongWithStatus.
    // Supabase types the FK join as any[] but many-to-one returns a single object at runtime.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped: SongWithLessons[] = (data as any[]).map((sr) => ({
      ...(Array.isArray(sr.songs) ? sr.songs[0] : sr.songs),
      status: sr.current_status,
    }));

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
