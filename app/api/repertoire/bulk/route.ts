import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  CreateRepertoireInputSchema,
  StudentRepertoireSchema,
  type CreateRepertoireInput,
  type StudentRepertoireType,
} from '@/schemas/StudentRepertoireSchema';
import {
  TEST_ACCOUNT_MUTATION_ERROR,
  isDemoMutationBlocked,
} from '@/lib/auth/test-account-guard';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_teacher, is_development')
      .eq('id', user.id)
      .single();

    if (profile?.is_development) {
      return NextResponse.json({ error: TEST_ACCOUNT_MUTATION_ERROR }, { status: 403 });
    }

    if (!profile || (!profile.is_admin && !profile.is_teacher)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { entries } = body;

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json(
        { error: 'Entries array is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (entries.length > 100) {
      return NextResponse.json(
        { error: 'Cannot process more than 100 entries at once' },
        { status: 400 }
      );
    }

    const results = {
      created: [] as StudentRepertoireType[],
      errors: [] as Array<{
        index: number;
        error: string;
        details?: unknown;
        data?: unknown;
      }>,
      total: entries.length,
      success: 0,
      failed: 0,
    };

    // Validate all entries upfront
    const validatedEntries: CreateRepertoireInput[] = [];
    for (let i = 0; i < entries.length; i++) {
      const parsed = CreateRepertoireInputSchema.safeParse(entries[i]);
      if (!parsed.success) {
        results.errors.push({
          index: i,
          error: 'Validation failed',
          details: parsed.error.issues,
        });
        results.failed++;
      } else {
        validatedEntries.push(parsed.data);
      }
    }

    if (validatedEntries.length === 0) {
      return NextResponse.json(results, { status: 400 });
    }

    // Process validated entries
    for (let i = 0; i < validatedEntries.length; i++) {
      try {
        const entry = validatedEntries[i];

        const { data: row, error } = await supabase
          .from('student_repertoire')
          .insert({
            ...entry,
            assigned_by: entry.assigned_by ?? user.id,
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            results.errors.push({
              index: i,
              error: 'Song already in student repertoire',
              data: entry,
            });
          } else {
            results.errors.push({
              index: i,
              error: error.message,
              data: entry,
            });
          }
          results.failed++;
        } else {
          const validated = StudentRepertoireSchema.safeParse(row);
          if (validated.success) {
            results.created.push(validated.data);
            results.success++;
          } else {
            results.errors.push({
              index: i,
              error: 'Response validation failed',
              details: validated.error.issues,
            });
            results.failed++;
          }
        }
      } catch (error) {
        results.errors.push({
          index: i,
          error: 'Unexpected error',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
        results.failed++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    logger.error('Error in bulk repertoire creation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
