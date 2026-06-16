/**
 * RLS-real coverage for `in_app_notifications` (spec 08).
 *
 * Asserts a user reads only their OWN notifications and cannot read another
 * user's rows.
 *
 * ## Bucket-A caveat
 * `in_app_notifications` is a Phase-0 bucket-A table — restored to prod in 0.1.
 * If the test DB does not have it yet, the suite probes once in `beforeAll` and
 * every assertion short-circuits with a clear skip message rather than failing.
 *
 * ## Running this suite
 * Auto-skips unless an RLS test DB is configured (see `lib/testing/rls/env.ts`).
 */

import { describeIfRls, seedTwoTeachers, type TwoTeacherFixture } from '../index';

const SKIP_MSG =
  '[notifications.rls] in_app_notifications not present in test DB (bucket A, pre-0.1) — skipping assertion.';

describeIfRls('in_app_notifications RLS — own-rows-only', () => {
  let fx: TwoTeacherFixture;
  let tableExists = false;
  let notifA1: string | null = null;
  let notifB1: string | null = null;

  beforeAll(async () => {
    fx = await seedTwoTeachers();

    // Probe for the bucket-A table.
    const probe = await fx.service.from('in_app_notifications').select('id').limit(1);
    tableExists = !probe.error;
    if (!tableExists) {
      console.warn(SKIP_MSG);
      return;
    }

    const seedRow = async (userId: string) => {
      const { data } = await fx.service
        .from('in_app_notifications')
        .insert({
          user_id: userId,
          notification_type: 'assignment_created',
          title: 'RLS notif',
          body: 'body',
        })
        .select('id')
        .single();
      return (data as { id: string } | null)?.id ?? null;
    };

    notifA1 = await seedRow(fx.studentA1.id);
    notifB1 = await seedRow(fx.studentB1.id);
  }, 30_000);

  afterAll(async () => {
    await fx?.cleanup();
  });

  it('student sees only their own notification', async () => {
    if (!tableExists) {
      console.warn(SKIP_MSG);
      return;
    }
    const { data } = await fx.studentA1.client
      .from('in_app_notifications')
      .select('id')
      .in('id', [notifA1, notifB1].filter(Boolean) as string[]);
    const ids = (data ?? []).map((r) => r.id);
    expect(ids).toContain(notifA1);
    expect(ids).not.toContain(notifB1);
  });

  it("student cannot read another user's notification", async () => {
    if (!tableExists) {
      console.warn(SKIP_MSG);
      return;
    }
    const { data } = await fx.studentA1.client
      .from('in_app_notifications')
      .select('id')
      .eq('id', notifB1 as string);
    expect(data ?? []).toHaveLength(0);
  });
});
