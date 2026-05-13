import { ProfileEditSchema } from '@/schemas/ProfileSchema';

describe('ProfileEditSchema', () => {
  const valid = {
    firstname: 'Ada',
    lastname: 'Lovelace',
  };

  it('accepts the minimal valid payload', () => {
    expect(ProfileEditSchema.parse(valid)).toEqual({ ...valid });
  });

  it('rejects an empty firstname or lastname', () => {
    expect(() => ProfileEditSchema.parse({ ...valid, firstname: '' })).toThrow(
      /First name is required/
    );
    expect(() => ProfileEditSchema.parse({ ...valid, lastname: '' })).toThrow(
      /Last name is required/
    );
  });

  it('rejects oversized firstname / lastname (>100 chars)', () => {
    const long = 'a'.repeat(101);
    expect(() => ProfileEditSchema.parse({ ...valid, firstname: long })).toThrow();
    expect(() => ProfileEditSchema.parse({ ...valid, lastname: long })).toThrow();
  });

  describe('username', () => {
    it('is optional', () => {
      expect(ProfileEditSchema.parse(valid).username).toBeUndefined();
    });

    it('requires at least 3 characters when provided', () => {
      expect(() => ProfileEditSchema.parse({ ...valid, username: 'ab' })).toThrow(
        /at least 3 characters/
      );
    });

    it('caps at 50 characters', () => {
      expect(() => ProfileEditSchema.parse({ ...valid, username: 'u'.repeat(51) })).toThrow();
    });
  });

  describe('bio', () => {
    it('caps at 500 characters', () => {
      expect(() => ProfileEditSchema.parse({ ...valid, bio: 'b'.repeat(501) })).toThrow(
        /Bio must be less than 500/
      );
    });
  });

  describe('spotifyPlaylistUrl', () => {
    it('accepts a valid Spotify URL', () => {
      const parsed = ProfileEditSchema.parse({
        ...valid,
        spotifyPlaylistUrl: 'https://open.spotify.com/playlist/abc123',
      });
      expect(parsed.spotifyPlaylistUrl).toBe('https://open.spotify.com/playlist/abc123');
    });

    it('accepts an empty string (cleared field)', () => {
      const parsed = ProfileEditSchema.parse({
        ...valid,
        spotifyPlaylistUrl: '',
      });
      expect(parsed.spotifyPlaylistUrl).toBe('');
    });

    it('rejects a non-Spotify URL', () => {
      expect(() =>
        ProfileEditSchema.parse({
          ...valid,
          spotifyPlaylistUrl: 'https://youtube.com/playlist',
        })
      ).toThrow(/Must be a Spotify URL/);
    });

    it('rejects an invalid URL string', () => {
      expect(() =>
        ProfileEditSchema.parse({
          ...valid,
          spotifyPlaylistUrl: 'not-a-url',
        })
      ).toThrow();
    });
  });
});
