import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

const LessonTemplateInputSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().min(1, 'Category is required').max(100),
  duration: z.number().int().positive().max(480).optional().default(60),
  structure: z.string().max(5000).optional().nullable(),
  teacher_id: z.string().uuid('teacher_id must be a valid UUID'),
});

export async function GET(request: NextRequest) {
  return withApiAuth(request, async () => {
    try {
      const supabase = await createClient();
      const { searchParams } = new URL(request.url);

      const category = searchParams.get('category');
      const teacherId = searchParams.get('teacherId');

      let query = supabase.from('lesson_templates').select(`
        *,
        teacher_profile:profiles!lesson_templates_teacher_id_fkey(email, first_name, last_name)
      `);

      if (category) {
        query = query.eq('category', category);
      }

      if (teacherId) {
        query = query.eq('teacher_id', teacherId);
      }

      query = query.order('created_at', { ascending: false });

      const { data: templates, error } = await query;

      if (error) {
        if (error.message?.includes('lesson_templates')) {
          return NextResponse.json({ templates: [] });
        }
        logger.error('Error fetching lesson templates:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ templates: templates || [] });
    } catch (error) {
      logger.error('Error in lesson templates API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withApiAuth(request, async ({ user, roles }) => {
    try {
      const supabase = await createClient();

      if (!roles.isAdmin && !roles.isTeacher) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
      }

      const parsed = LessonTemplateInputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { name, description, category, duration, structure, teacher_id } = parsed.data;

      const { data: template, error } = await supabase
        .from('lesson_templates')
        .insert({
          name,
          description: description ?? null,
          category,
          duration: duration ?? 60,
          structure: structure ?? null,
          teacher_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating lesson template:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(template);
    } catch (error) {
      logger.error('Error in lesson template creation API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
