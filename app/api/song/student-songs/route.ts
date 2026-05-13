import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { SongWithLessons } from '@/schemas/SongSchema';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

const querySchema = z.object({
  userId: z.string().uuid(),
  level: z.string().optional(),
});

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }
  const supabase = createAdminClient();

  // Get user profile for role-based access
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, is_teacher, is_student')
    .eq('id', auth.user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  let userId = searchParams.get('userId');
  const level = searchParams.get('level') ?? undefined;

  // Students can only see their own songs
  if (profile.is_student && !profile.is_admin && !profile.is_teacher) {
    userId = auth.user.id;
  }

  const parseResult = querySchema.safeParse({ userId, level });
  if (!parseResult.success) {
    return NextResponse.json({ error: 'Invalid query params' }, { status: 400 });
  }

  // Fetch songs from student_repertoire for the given student
  const { data, error } = await supabase
    .from('student_repertoire')
    .select('current_status, songs(*)')
    .eq('student_id', parseResult.data.userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const mapped: SongWithLessons[] = data.map(
    (row: { songs: SongWithLessons; current_status: string }) => ({
      ...row.songs,
      status: row.current_status,
    })
  );

  const filtered = level ? mapped.filter((song) => song.level === level) : mapped;

  return NextResponse.json(filtered);
}
