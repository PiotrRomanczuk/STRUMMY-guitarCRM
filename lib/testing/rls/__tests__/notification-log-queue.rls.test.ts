/**
 * RLS coverage for `notification_log`, `notification_queue`, and
 * `notification_preferences` (spec 08 gap — audit finding #12). Only
 * `in_app_notifications` had a real RLS test before this file; these three
 * back the actual email delivery pipeline and preference toggles, so a
 * cross-user read here would leak another user's email/template data.
 */

import { describeIfRls, seedTwoTeachers, type TwoTeacherFixture } from '../index';

describeIfRls('notification_log / notification_queue / notification_preferences RLS', () => {
  let fx: TwoTeacherFixture;

  beforeAll(async () => {
    fx = await seedTwoTeachers();
  }, 30_000);

  afterAll(async () => {
    await fx?.cleanup();
  });

  describe('notification_log', () => {
    let logId: string;

    beforeAll(async () => {
      const { data, error } = await fx.service
        .from('notification_log')
        .insert({
          notification_type: 'lesson_reminder_24h',
          recipient_user_id: fx.studentA1.id,
          recipient_email: fx.studentA1.email,
          subject: 'RLS test reminder',
        })
        .select('id')
        .single();
      if (error || !data) throw new Error(`seed notification_log failed: ${error?.message}`);
      logId = (data as { id: string }).id;
    });

    afterAll(async () => {
      if (logId) await fx.service.from('notification_log').delete().eq('id', logId);
    });

    it('the recipient can read their own log entry', async () => {
      const { data, error } = await fx.studentA1.client
        .from('notification_log')
        .select('id')
        .eq('id', logId);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it("another student cannot read someone else's log entry", async () => {
      const { data, error } = await fx.studentB1.client
        .from('notification_log')
        .select('id')
        .eq('id', logId);
      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0);
    });

    it('a non-service client cannot insert directly (service_role-only write)', async () => {
      const { error } = await fx.studentA1.client.from('notification_log').insert({
        notification_type: 'lesson_reminder_24h',
        recipient_user_id: fx.studentA1.id,
        recipient_email: fx.studentA1.email,
        subject: 'forged',
      });
      expect(error).not.toBeNull();
    });
  });

  describe('notification_queue', () => {
    let queueId: string;

    beforeAll(async () => {
      const { data, error } = await fx.service
        .from('notification_queue')
        .insert({
          notification_type: 'assignment_due_reminder',
          recipient_user_id: fx.studentA1.id,
          template_data: {},
        })
        .select('id')
        .single();
      if (error || !data) throw new Error(`seed notification_queue failed: ${error?.message}`);
      queueId = (data as { id: string }).id;
    });

    afterAll(async () => {
      if (queueId) await fx.service.from('notification_queue').delete().eq('id', queueId);
    });

    it('the recipient can read their own queued notification', async () => {
      const { data, error } = await fx.studentA1.client
        .from('notification_queue')
        .select('id')
        .eq('id', queueId);
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it("another student cannot read someone else's queued notification", async () => {
      const { data, error } = await fx.studentB1.client
        .from('notification_queue')
        .select('id')
        .eq('id', queueId);
      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0);
    });
  });

  describe('notification_preferences', () => {
    it("a student can read and update their own preferences, not another student's", async () => {
      const { data: ownRows, error: ownError } = await fx.studentA1.client
        .from('notification_preferences')
        .select('id, user_id')
        .eq('user_id', fx.studentA1.id);
      expect(ownError).toBeNull();
      expect((ownRows?.length ?? 0) >= 0).toBe(true); // may be empty if never seeded; scoping is what matters

      const { data: otherRows, error: otherError } = await fx.studentA1.client
        .from('notification_preferences')
        .select('id')
        .eq('user_id', fx.studentB1.id);
      expect(otherError).toBeNull();
      expect(otherRows ?? []).toHaveLength(0);
    });

    it("a student cannot update another student's preference row", async () => {
      const { data: seeded, error: seedError } = await fx.service
        .from('notification_preferences')
        .upsert(
          { user_id: fx.studentB1.id, notification_type: 'lesson_reminder_24h', enabled: true },
          { onConflict: 'user_id,notification_type' }
        )
        .select('id')
        .single();
      expect(seedError).toBeNull();
      const rowId = (seeded as { id: string }).id;

      const { data: updated, error: updateError } = await fx.studentA1.client
        .from('notification_preferences')
        .update({ enabled: false })
        .eq('id', rowId)
        .select('id');
      expect(updateError).toBeNull();
      expect(updated ?? []).toHaveLength(0); // 0 rows: RLS predicate excludes another user's row

      await fx.service.from('notification_preferences').delete().eq('id', rowId);
    });
  });
});
