/**
 * RLS coverage for the content/production tables (spec 09 gap — audit
 * finding #12): `content_posts`, `content_post_metrics`, and `hashtag_sets`
 * had no RLS-real tests before this file. All three are gated by the single
 * `is_admin_or_teacher()` predicate — students get no access at all.
 */

import { describeIfRls, seedTwoTeachers, type TwoTeacherFixture } from '../index';

describeIfRls('content/production tables RLS — staff-only via is_admin_or_teacher()', () => {
  let fx: TwoTeacherFixture;
  let songId: string;
  let postId: string;

  beforeAll(async () => {
    fx = await seedTwoTeachers();
    const { data, error } = await fx.service
      .from('songs')
      .insert({ title: 'RLS content-tables song' })
      .select('id')
      .single();
    if (error || !data) throw new Error(`seed song failed: ${error?.message}`);
    songId = (data as { id: string }).id;
  }, 30_000);

  afterAll(async () => {
    await fx?.cleanup();
  });

  describe('content_posts', () => {
    it('a teacher can insert and read a content post', async () => {
      const { data, error } = await fx.teacherA.client
        .from('content_posts')
        .insert({ song_id: songId, platform: 'instagram' })
        .select('id')
        .single();
      expect(error).toBeNull();
      postId = (data as { id: string }).id;

      const { data: read, error: readError } = await fx.teacherA.client
        .from('content_posts')
        .select('id')
        .eq('id', postId);
      expect(readError).toBeNull();
      expect(read).toHaveLength(1);
    });

    it('a student cannot insert or read content posts', async () => {
      const insert = await fx.studentA1.client
        .from('content_posts')
        .insert({ song_id: songId, platform: 'tiktok' });
      expect(insert.error).not.toBeNull();

      const read = await fx.studentA1.client.from('content_posts').select('id').eq('id', postId);
      expect(read.error).toBeNull();
      expect(read.data ?? []).toHaveLength(0);
    });
  });

  describe('content_post_metrics', () => {
    let metricId: string;

    afterAll(async () => {
      if (metricId) await fx.service.from('content_post_metrics').delete().eq('id', metricId);
      if (postId) await fx.service.from('content_posts').delete().eq('id', postId);
    });

    it('a teacher can insert and read metrics for a post', async () => {
      const { data, error } = await fx.teacherA.client
        .from('content_post_metrics')
        .insert({ post_id: postId, views_count: 100 })
        .select('id')
        .single();
      expect(error).toBeNull();
      metricId = (data as { id: string }).id;
    });

    it('a student cannot read content post metrics', async () => {
      const { data, error } = await fx.studentA1.client
        .from('content_post_metrics')
        .select('id')
        .eq('post_id', postId);
      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0);
    });
  });

  describe('hashtag_sets', () => {
    let hashtagSetId: string;

    afterAll(async () => {
      if (hashtagSetId) await fx.service.from('hashtag_sets').delete().eq('id', hashtagSetId);
    });

    it('a teacher can create and read a hashtag set', async () => {
      const { data, error } = await fx.teacherA.client
        .from('hashtag_sets')
        .insert({ name: `RLS test set ${Date.now()}`, hashtags: ['#guitar', '#practice'] })
        .select('id')
        .single();
      expect(error).toBeNull();
      hashtagSetId = (data as { id: string }).id;
    });

    it('a student cannot read or write hashtag sets', async () => {
      const read = await fx.studentA1.client
        .from('hashtag_sets')
        .select('id')
        .eq('id', hashtagSetId);
      expect(read.error).toBeNull();
      expect(read.data ?? []).toHaveLength(0);

      const write = await fx.studentA1.client
        .from('hashtag_sets')
        .insert({ name: `student attempt ${Date.now()}`, hashtags: [] });
      expect(write.error).not.toBeNull();
    });
  });
});
