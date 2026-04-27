import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/app/api/content/_lib/require-teacher';
import type { ContentPost } from '@/types/ContentPost';

interface CalendarEntry extends ContentPost {
  song: { id: string; title: string; author: string | null } | null;
}

export async function GET(request: NextRequest) {
  const gate = await requireTeacher();
  if (!gate.ok) return gate.response;
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  let query = gate.ctx.supabase
    .from('content_posts')
    .select('*, song:songs(id, title, author)')
    .order('scheduled_at', { ascending: true, nullsFirst: false });
  if (from) query = query.gte('scheduled_at', from);
  if (to) query = query.lte('scheduled_at', to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: (data ?? []) as CalendarEntry[] });
}
