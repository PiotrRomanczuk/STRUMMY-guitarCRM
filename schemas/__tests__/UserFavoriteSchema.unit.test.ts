import {
  UserFavoriteInputSchema,
  UserFavoriteSortSchema,
  UserFavoriteFilterSchema,
} from '@/schemas/UserFavoriteSchema';

const UUID = 'aaaaaaaa-3333-4333-8333-333333333333';

describe('UserFavoriteInputSchema', () => {
  it('accepts a valid input', () => {
    const parsed = UserFavoriteInputSchema.parse({
      user_id: UUID,
      song_id: UUID,
    });
    expect(parsed).toEqual({ user_id: UUID, song_id: UUID });
  });

  it('rejects a non-UUID user_id', () => {
    expect(() => UserFavoriteInputSchema.parse({ user_id: 'no', song_id: UUID })).toThrow(
      /User ID is required/
    );
  });

  it('rejects a non-UUID song_id', () => {
    expect(() => UserFavoriteInputSchema.parse({ user_id: UUID, song_id: 'no' })).toThrow(
      /Song ID is required/
    );
  });
});

describe('UserFavoriteSortSchema', () => {
  it.each(['created_at', 'song_title', 'song_author'])('accepts field %s', (field) => {
    expect(UserFavoriteSortSchema.parse({ field }).field).toBe(field);
  });

  it('defaults direction to desc', () => {
    expect(UserFavoriteSortSchema.parse({ field: 'created_at' }).direction).toBe('desc');
  });

  it.each(['asc', 'desc'])('accepts direction %s', (direction) => {
    expect(UserFavoriteSortSchema.parse({ field: 'created_at', direction }).direction).toBe(
      direction
    );
  });
});

describe('UserFavoriteFilterSchema', () => {
  it('accepts an empty filter', () => {
    expect(UserFavoriteFilterSchema.parse({})).toEqual({});
  });

  it('rejects a malformed user_id when provided', () => {
    expect(() => UserFavoriteFilterSchema.parse({ user_id: 'no' })).toThrow();
  });

  it('preserves search text', () => {
    expect(UserFavoriteFilterSchema.parse({ search: 'wonderwall' }).search).toBe('wonderwall');
  });
});
