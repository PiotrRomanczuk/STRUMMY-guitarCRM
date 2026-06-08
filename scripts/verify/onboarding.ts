import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient, signInAs } from './lib/supabase-clients';
import type { Reporter } from './lib/reporter';

const PASSWORD = `verify-onboarding-${Date.now()}`;

const FK_CHECKS: Array<{ table: string; idColumn: string; label: string }> = [
  { table: 'lessons', idColumn: 'student_id', label: 'FK migrated: lessons.student_id' },
  { table: 'assignments', idColumn: 'student_id', label: 'FK migrated: assignments.student_id' },
  {
    table: 'in_app_notifications',
    idColumn: 'user_id',
    label: 'FK migrated: in_app_notifications.user_id',
  },
];

type Context = {
  shadowId: string;
  email: string;
  teacherId: string;
  newUserId?: string;
  lessonId?: string;
  assignmentId?: string;
  notificationId?: string;
};

export async function runOnboarding(reporter: Reporter, email: string): Promise<void> {
  reporter.section(`Onboarding verifier — ${email}`);
  const admin = createServiceClient();
  const ctx: Context = { shadowId: randomUUID(), email, teacherId: '' };

  try {
    await provisionTeacher(reporter, admin, ctx);
    await createShadowProfile(reporter, admin, ctx);
    await seedRelatedRows(reporter, admin, ctx);
    await runSignup(reporter, admin, ctx);
    await assertProfileSwap(reporter, admin, ctx);
    await assertFkMigration(reporter, admin, ctx);
    await assertRlsSelfQuery(reporter, ctx);
  } finally {
    await cleanup(reporter, admin, ctx);
  }
}

async function provisionTeacher(
  reporter: Reporter,
  admin: SupabaseClient,
  ctx: Context
): Promise<void> {
  await reporter.step('teacher profile available (seed prereq)', async () => {
    const { data, error } = await admin
      .from('profiles')
      .select('id')
      .eq('is_teacher', true)
      .eq('is_shadow', false)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`profile lookup failed: ${error.message}`);
    if (!data) throw new Error('No non-shadow teacher in local DB. Run `npm run seed` first.');
    ctx.teacherId = data.id;
  });
}

async function createShadowProfile(
  reporter: Reporter,
  admin: SupabaseClient,
  ctx: Context
): Promise<void> {
  await reporter.step(
    `shadow profile created (id=${ctx.shadowId.slice(0, 8)}…, invite_email=${ctx.email})`,
    async () => {
      const placeholderEmail = `shadow_${ctx.shadowId}@placeholder.com`;
      const { error } = await admin.from('profiles').insert({
        id: ctx.shadowId,
        user_id: null,
        email: placeholderEmail,
        invite_email: ctx.email,
        full_name: 'Verify Onboarding Test User',
        is_shadow: true,
        is_student: true,
        is_teacher: false,
        is_admin: false,
      });
      if (error) throw new Error(`shadow insert failed: ${error.message}`);
    }
  );
}

async function seedRelatedRows(
  reporter: Reporter,
  admin: SupabaseClient,
  ctx: Context
): Promise<void> {
  await reporter.step(
    'seeded 3 related rows under shadow (lesson, assignment, notification)',
    async () => {
      const lesson = await admin
        .from('lessons')
        .insert({
          student_id: ctx.shadowId,
          teacher_id: ctx.teacherId,
          scheduled_at: new Date(Date.now() + 86_400_000).toISOString(),
          title: 'Verify CLI test lesson',
        })
        .select('id')
        .single();
      if (lesson.error) throw new Error(`lesson insert: ${lesson.error.message}`);
      ctx.lessonId = lesson.data.id;

      const assignment = await admin
        .from('assignments')
        .insert({
          student_id: ctx.shadowId,
          teacher_id: ctx.teacherId,
          title: 'Verify CLI test assignment',
        })
        .select('id')
        .single();
      if (assignment.error) throw new Error(`assignment insert: ${assignment.error.message}`);
      ctx.assignmentId = assignment.data.id;

      const notif = await admin
        .from('in_app_notifications')
        .insert({
          user_id: ctx.shadowId,
          notification_type: 'lesson_reminder_24h',
          title: 'Verify CLI test notification',
          body: 'Test body',
        })
        .select('id')
        .single();
      if (notif.error) throw new Error(`notification insert: ${notif.error.message}`);
      ctx.notificationId = notif.data.id;
    }
  );
}

async function runSignup(reporter: Reporter, admin: SupabaseClient, ctx: Context): Promise<void> {
  await reporter.step(
    'Supabase Auth user created (email pre-confirmed; fires handle_new_user trigger)',
    async () => {
      const { data, error } = await admin.auth.admin.createUser({
        email: ctx.email,
        password: PASSWORD,
        email_confirm: true,
      });
      if (error) throw new Error(`auth.admin.createUser: ${error.message}`);
      ctx.newUserId = data.user.id;
    }
  );
}

async function assertProfileSwap(
  reporter: Reporter,
  admin: SupabaseClient,
  ctx: Context
): Promise<void> {
  await reporter.step(
    'profile swapped: new linked, shadow deleted, invite_email cleared',
    async () => {
      for (let i = 0; i < 15; i++) {
        const { data } = await admin
          .from('profiles')
          .select('id, email, invite_email, is_shadow, is_student')
          .eq('id', ctx.newUserId!)
          .maybeSingle();
        if (
          data &&
          !data.is_shadow &&
          data.email === ctx.email &&
          data.invite_email === null &&
          data.is_student
        ) {
          const { data: shadow } = await admin
            .from('profiles')
            .select('id')
            .eq('id', ctx.shadowId)
            .maybeSingle();
          if (!shadow) return;
        }
        await new Promise((r) => setTimeout(r, 200));
      }
      throw new Error(
        'Profile swap did not converge within 3s — trigger may not have fired correctly'
      );
    }
  );
}

async function assertFkMigration(
  reporter: Reporter,
  admin: SupabaseClient,
  ctx: Context
): Promise<void> {
  for (const check of FK_CHECKS) {
    await reporter.step(check.label, async () => {
      const { data, error } = await admin
        .from(check.table)
        .select(`id`)
        .eq(check.idColumn, ctx.newUserId!)
        .limit(5);
      if (error) throw new Error(`${check.table} select: ${error.message}`);
      if (!data || data.length === 0) {
        throw new Error(
          `No ${check.table} row references new user_id — transfer skipped or rolled back`
        );
      }
    });
  }
}

async function assertRlsSelfQuery(reporter: Reporter, ctx: Context): Promise<void> {
  await reporter.step('signInAs new user → RLS-real query returns migrated lesson', async () => {
    const client = await signInAs(ctx.email, PASSWORD);
    const { data, error } = await client
      .from('lessons')
      .select('id, title')
      .eq('id', ctx.lessonId!);
    if (error) throw new Error(`RLS query failed: ${error.message}`);
    if (!data || data.length === 0) {
      throw new Error('New user could not see their migrated lesson — RLS or migration broken');
    }
  });
}

async function cleanup(reporter: Reporter, admin: SupabaseClient, ctx: Context): Promise<void> {
  await reporter.step('cleanup (delete fixture rows + auth user)', async () => {
    const failures: string[] = [];
    const tryDel = async (
      label: string,
      op: () => Promise<{ error: { message: string } | null }>
    ): Promise<void> => {
      const { error } = await op();
      if (error) failures.push(`${label}: ${error.message}`);
    };
    if (ctx.lessonId)
      await tryDel('lesson', () => admin.from('lessons').delete().eq('id', ctx.lessonId!));
    if (ctx.assignmentId)
      await tryDel('assignment', () =>
        admin.from('assignments').delete().eq('id', ctx.assignmentId!)
      );
    if (ctx.notificationId)
      await tryDel('notification', () =>
        admin.from('in_app_notifications').delete().eq('id', ctx.notificationId!)
      );
    if (ctx.newUserId) await tryDel('auth user', () => admin.auth.admin.deleteUser(ctx.newUserId!));
    await tryDel('shadow profile', () => admin.from('profiles').delete().eq('id', ctx.shadowId));
    if (failures.length)
      throw new Error(`${failures.length} cleanup step(s) failed:\n  ${failures.join('\n  ')}`);
  });
}
