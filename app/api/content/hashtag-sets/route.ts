import { NextRequest, NextResponse } from 'next/server';
import { requireTeacher } from '@/app/api/content/_lib/require-teacher';
import { listHashtagSets, createHashtagSet } from './handlers';

export async function GET() {
  const gate = await requireTeacher();
  if (!gate.ok) return gate.response;
  const result = await listHashtagSets(gate.ctx.supabase);
  if ('error' in result)
    return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const gate = await requireTeacher();
  if (!gate.ok) return gate.response;
  const body = await req.json();
  const result = await createHashtagSet(gate.ctx.supabase, body);
  if ('error' in result)
    return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json(result, { status: 201 });
}
