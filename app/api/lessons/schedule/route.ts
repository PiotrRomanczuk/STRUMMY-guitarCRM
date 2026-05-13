import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withApiAuth } from '@/lib/auth/withApiAuth';
import { logger } from '@/lib/logger';

const TeacherAvailabilityInputSchema = z.object({
  teacher_id: z.string().uuid('teacher_id must be a valid UUID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'start_time must be in HH:MM or HH:MM:SS format'),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'end_time must be in HH:MM or HH:MM:SS format'),
  is_available: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  return withApiAuth(request, async () => {
    try {
      const supabase = await createClient();
      const { searchParams } = new URL(request.url);

      const teacherId = searchParams.get('teacherId');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      if (!teacherId) {
        return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
      }

      // Get teacher availability
      let availabilityQuery = supabase
        .from('teacher_availability')
        .select('id, teacher_id, date, start_time, end_time, is_available')
        .eq('teacher_id', teacherId);

      if (dateFrom) {
        availabilityQuery = availabilityQuery.gte('date', dateFrom);
      }

      if (dateTo) {
        availabilityQuery = availabilityQuery.lte('date', dateTo);
      }

      const { data: availability, error: availabilityError } = await availabilityQuery;

      if (availabilityError) {
        logger.error('Error fetching teacher availability:', availabilityError);
        return NextResponse.json({ error: availabilityError.message }, { status: 500 });
      }

      // Get scheduled lessons for the teacher
      let lessonsQuery = supabase
        .from('lessons')
        .select(
          `
        *,
        profile:profiles!lessons_student_id_fkey(email, firstName, lastName)
      `
        )
        .eq('teacher_id', teacherId);

      if (dateFrom) {
        lessonsQuery = lessonsQuery.gte('date', dateFrom);
      }

      if (dateTo) {
        lessonsQuery = lessonsQuery.lte('date', dateTo);
      }

      const { data: lessons, error: lessonsError } = await lessonsQuery;

      if (lessonsError) {
        logger.error('Error fetching scheduled lessons:', lessonsError);
        return NextResponse.json({ error: lessonsError.message }, { status: 500 });
      }

      return NextResponse.json({
        availability: availability || [],
        scheduledLessons: lessons || [],
        teacherId,
      });
    } catch (error) {
      logger.error('Error in lesson schedule API:', error);
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

      const parsed = TeacherAvailabilityInputSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { teacher_id, date, start_time, end_time, is_available } = parsed.data;

      // Check for conflicts with existing availability
      const { data: existingAvailability, error: conflictError } = await supabase
        .from('teacher_availability')
        .select('id')
        .eq('teacher_id', teacher_id)
        .eq('date', date);

      if (conflictError) {
        logger.error('Error checking availability conflicts:', conflictError);
        return NextResponse.json({ error: conflictError.message }, { status: 500 });
      }

      if (existingAvailability && existingAvailability.length > 0) {
        return NextResponse.json(
          { error: 'Time slot conflicts with existing availability' },
          { status: 409 }
        );
      }

      const { data: availability, error } = await supabase
        .from('teacher_availability')
        .insert({
          teacher_id,
          date,
          start_time,
          end_time,
          is_available,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating teacher availability:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(availability);
    } catch (error) {
      logger.error('Error in lesson schedule creation API:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
