import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/app/api/content/_lib/require-teacher';
import { updateHashtagSet, deleteHashtagSet } from '../handlers';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const gate = await requireTeacher();
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const body = await req.json();
  const result = await updateHashtagSet(gate.ctx.supabase, id, body);
  if ('error' in result)
    return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const gate = await requireTeacher();
  if (!gate.ok) return gate.response;
  const { id } = await params;
  const result = await deleteHashtagSet(gate.ctx.supabase, id);
  if ('error' in result)
    return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}
