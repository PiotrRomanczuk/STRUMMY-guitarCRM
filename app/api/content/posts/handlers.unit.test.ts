import { listPosts, createPost, updatePost, deletePost } from './handlers';

type AnyFn = jest.Mock;

interface MockQuery {
  select: AnyFn;
  insert: AnyFn;
  update: AnyFn;
  delete: AnyFn;
  eq: AnyFn;
  gte: AnyFn;
  lte: AnyFn;
  order: AnyFn;
  single: AnyFn;
}

function buildQuery(overrides: Partial<MockQuery> = {}): MockQuery {
  const q: MockQuery = {
    select: jest.fn(() => q),
    insert: jest.fn(() => q),
    update: jest.fn(() => q),
    delete: jest.fn().mockResolvedValue({ data: null, error: null }),
    eq: jest.fn(() => q),
    gte: jest.fn(() => q),
    lte: jest.fn(() => q),
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
  return q;
}

function buildSupabase(query: MockQuery) {
  return {
    from: jest.fn(() => query),
  } as unknown as Parameters<typeof listPosts>[0];
}

describe('content posts handlers', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('listPosts', () => {
    it('applies song_id and date filters', async () => {
      const q = buildQuery({
        order: jest.fn().mockResolvedValue({
          data: [{ id: 'p1', song_id: 's1' }],
          error: null,
        }),
      });
      const result = await listPosts(buildSupabase(q), {
        songId: 's1',
        from: '2026-05-01T00:00:00Z',
        to: '2026-05-31T23:59:59Z',
      });
      expect('posts' in result).toBe(true);
      expect(q.eq).toHaveBeenCalledWith('song_id', 's1');
      expect(q.gte).toHaveBeenCalled();
      expect(q.lte).toHaveBeenCalled();
    });

    it('returns API error on DB failure', async () => {
      const q = buildQuery({
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
      });
      const result = await listPosts(buildSupabase(q), {});
      expect(result).toEqual({ error: 'boom', status: 500 });
    });
  });

  describe('createPost', () => {
    it('returns 400 on invalid input (missing song_id)', async () => {
      const q = buildQuery();
      const result = await createPost(buildSupabase(q), { platform: 'tiktok' });
      expect('error' in result && result.status).toBe(400);
    });

    it('inserts and returns post on valid input', async () => {
      const q = buildQuery({
        single: jest.fn().mockResolvedValue({
          data: { id: 'new', song_id: 's1', platform: 'tiktok', status: 'planned' },
          error: null,
        }),
      });
      const result = await createPost(buildSupabase(q), {
        song_id: '2cf24dba-5fb0-4a30-9b9f-c5b3e76fa5b1',
        platform: 'tiktok',
      });
      expect('post' in result).toBe(true);
    });

    it('returns 409 on unique conflict', async () => {
      const q = buildQuery({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'duplicate' },
        }),
      });
      const result = await createPost(buildSupabase(q), {
        song_id: '2cf24dba-5fb0-4a30-9b9f-c5b3e76fa5b1',
        platform: 'tiktok',
      });
      expect('status' in result && result.status).toBe(409);
    });
  });

  describe('updatePost', () => {
    it('blocks invalid status transition', async () => {
      // First .single() returns current status='planned';
      // because handler checks transition before update.
      const single = jest.fn().mockResolvedValueOnce({ data: { status: 'planned' }, error: null });
      const q = buildQuery({ single });
      const result = await updatePost(buildSupabase(q), 'id', { status: 'published' });
      expect('error' in result && result.status).toBe(422);
    });

    it('auto-fills published_at when transitioning to published', async () => {
      const updateCall = jest.fn(() => q);
      const single = jest
        .fn()
        .mockResolvedValueOnce({ data: { status: 'scheduled' }, error: null })
        .mockResolvedValueOnce({
          data: { id: 'id', status: 'published', published_at: 'auto' },
          error: null,
        });
      const q = buildQuery({ update: updateCall, single });
      await updatePost(buildSupabase(q), 'id', { status: 'published' });
      const arg = updateCall.mock.calls[0][0];
      expect(arg.published_at).toBeTruthy();
    });
  });

  describe('deletePost', () => {
    it('returns success on clean delete', async () => {
      const q = buildQuery({
        delete: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
      });
      const result = await deletePost(buildSupabase(q), 'id');
      expect(result).toEqual({ success: true });
    });
  });
});
