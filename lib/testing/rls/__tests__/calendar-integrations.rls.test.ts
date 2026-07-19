/**
 * RLS coverage for the calendar integration tables (spec 07 gap — audit
 * finding #12): `user_integrations`, `webhook_subscriptions`, and
 * `sync_conflicts` had no RLS-real tests before this file.
 */

import { describeIfRls, seedTwoTeachers, type TwoTeacherFixture } from '../index';

describeIfRls('calendar integration tables RLS — own-rows-only', () => {
  let fx: TwoTeacherFixture;

  beforeAll(async () => {
    fx = await seedTwoTeachers();
  }, 30_000);

  afterAll(async () => {
    await fx?.cleanup();
  });

  describe('user_integrations', () => {
    afterEach(async () => {
      await fx.service.from('user_integrations').delete().eq('user_id', fx.teacherA.id);
    });

    it('a teacher can insert and read their own integration row', async () => {
      const { error: insertError } = await fx.teacherA.client
        .from('user_integrations')
        .insert({ user_id: fx.teacherA.id, provider: 'google_calendar', access_token: 'tok-a' });
      expect(insertError).toBeNull();

      const { data, error } = await fx.teacherA.client
        .from('user_integrations')
        .select('provider')
        .eq('user_id', fx.teacherA.id);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it("a teacher cannot read another teacher's integration row", async () => {
      await fx.service
        .from('user_integrations')
        .insert({ user_id: fx.teacherB.id, provider: 'google_calendar', access_token: 'tok-b' });

      const { data, error } = await fx.teacherA.client
        .from('user_integrations')
        .select('provider')
        .eq('user_id', fx.teacherB.id);
      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0);

      await fx.service.from('user_integrations').delete().eq('user_id', fx.teacherB.id);
    });
  });

  describe('webhook_subscriptions', () => {
    afterEach(async () => {
      await fx.service.from('webhook_subscriptions').delete().eq('user_id', fx.teacherA.id);
    });

    it('a teacher can insert and read their own webhook subscription', async () => {
      const { error: insertError } = await fx.teacherA.client.from('webhook_subscriptions').insert({
        user_id: fx.teacherA.id,
        provider: 'google_calendar',
        channel_id: `chan-${fx.teacherA.id}`,
        resource_id: 'res-a',
        expiration: Date.now() + 3_600_000,
      });
      expect(insertError).toBeNull();

      const { data, error } = await fx.teacherA.client
        .from('webhook_subscriptions')
        .select('id')
        .eq('user_id', fx.teacherA.id);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it("a teacher cannot read another teacher's webhook subscription", async () => {
      await fx.service.from('webhook_subscriptions').insert({
        user_id: fx.teacherB.id,
        provider: 'google_calendar',
        channel_id: `chan-${fx.teacherB.id}`,
        resource_id: 'res-b',
        expiration: Date.now() + 3_600_000,
      });

      const { data, error } = await fx.teacherA.client
        .from('webhook_subscriptions')
        .select('id')
        .eq('user_id', fx.teacherB.id);
      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0);

      await fx.service.from('webhook_subscriptions').delete().eq('user_id', fx.teacherB.id);
    });
  });

  describe('sync_conflicts', () => {
    let conflictOnLessonA: string;

    beforeAll(async () => {
      const { data, error } = await fx.service
        .from('sync_conflicts')
        .insert({
          lesson_id: fx.lessonA.id,
          google_event_id: 'evt-a',
          conflict_data: { reason: 'test' },
        })
        .select('id')
        .single();
      if (error || !data) throw new Error(`seed sync_conflicts failed: ${error?.message}`);
      conflictOnLessonA = (data as { id: string }).id;
    });

    afterAll(async () => {
      await fx.service.from('sync_conflicts').delete().eq('id', conflictOnLessonA);
    });

    it("a teacher sees only conflicts on their own lessons' events", async () => {
      const own = await fx.teacherA.client
        .from('sync_conflicts')
        .select('id')
        .eq('lesson_id', fx.lessonA.id);
      expect(own.error).toBeNull();
      expect(own.data?.length ?? 0).toBeGreaterThan(0);

      const other = await fx.teacherB.client
        .from('sync_conflicts')
        .select('id')
        .eq('lesson_id', fx.lessonA.id);
      expect(other.error).toBeNull();
      expect(other.data ?? []).toHaveLength(0);
    });

    it('a student cannot insert a sync_conflicts row (staff-only insert)', async () => {
      const { error } = await fx.studentA1.client.from('sync_conflicts').insert({
        lesson_id: fx.lessonA.id,
        google_event_id: 'evt-student-attempt',
        conflict_data: {},
      });
      expect(error).not.toBeNull();
    });

    it('deleting a conflict is blocked until it is resolved', async () => {
      const { error, data } = await fx.teacherA.client
        .from('sync_conflicts')
        .delete()
        .eq('id', conflictOnLessonA)
        .select('id');
      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0); // 0 rows: still 'pending', RLS predicate excludes it

      const { data: stillThere } = await fx.service
        .from('sync_conflicts')
        .select('id')
        .eq('id', conflictOnLessonA)
        .maybeSingle();
      expect(stillThere?.id).toBe(conflictOnLessonA);
    });
  });
});
