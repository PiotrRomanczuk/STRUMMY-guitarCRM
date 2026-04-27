import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/app/api/content/_lib/require-teacher';
import { listPosts, createPost } from './handlers';
import type { ContentPlatform, ContentPostStatus } from '@/types/ContentPost';

export async function GET(request: NextRequest) {
  const gate = await requireTeacher();
  if (!gate.ok) return gate.response;
  const url = new URL(request.url);
  const result = await listPosts(gate.ctx.supabase, {
    songId: url.searchParams.get('song_id') ?? undefined,
    platform: (url.searchParams.get('platform') as ContentPlatform) ?? undefined,
    status: (url.searchParams.get('status') as ContentPostStatus) ?? undefined,
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
  });
  if ('error' in result)
    return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const gate = await requireTeacher();
  if (!gate.ok) return gate.response;
  const body = await request.json();
  const result = await createPost(gate.ctx.supabase, body);
  if ('error' in result)
    return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result, { status: 201 });
}
