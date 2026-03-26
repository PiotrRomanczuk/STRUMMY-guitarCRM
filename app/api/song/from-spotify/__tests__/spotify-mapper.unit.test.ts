import {
  mapSpotifyKey,
  extractReleaseYear,
  extractTrackId,
  mapSpotifyToSongDraft,
  type SpotifyAudioFeatures,
} from '../spotify-mapper';
import type { SpotifyApiTrack } from '@/types/spotify';

// ---------------------------------------------------------------------------
// mapSpotifyKey
// ---------------------------------------------------------------------------
describe('mapSpotifyKey', () => {
  it.each([
    [0, 1, 'C'],
    [1, 1, 'C#'],
    [2, 1, 'D'],
    [3, 1, 'D#'],
    [4, 1, 'E'],
    [5, 1, 'F'],
    [6, 1, 'F#'],
    [7, 1, 'G'],
    [8, 1, 'G#'],
    [9, 1, 'A'],
    [10, 1, 'A#'],
    [11, 1, 'B'],
  ])('maps pitch class %i major (mode=%i) → %s', (pitchClass, mode, expected) => {
    expect(mapSpotifyKey(pitchClass, mode)).toBe(expected);
  });

  it.each([
    [0, 0, 'Cm'],
    [1, 0, 'C#m'],
    [2, 0, 'Dm'],
    [3, 0, 'D#m'],
    [4, 0, 'Em'],
    [5, 0, 'Fm'],
    [6, 0, 'F#m'],
    [7, 0, 'Gm'],
    [8, 0, 'G#m'],
    [9, 0, 'Am'],
    [10, 0, 'A#m'],
    [11, 0, 'Bm'],
  ])('maps pitch class %i minor (mode=%i) → %s', (pitchClass, mode, expected) => {
    expect(mapSpotifyKey(pitchClass, mode)).toBe(expected);
  });

  it('returns undefined for unknown key (-1)', () => {
    expect(mapSpotifyKey(-1, 1)).toBeUndefined();
  });

  it('returns undefined for out-of-range pitch class (12)', () => {
    expect(mapSpotifyKey(12, 0)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// extractReleaseYear
// ---------------------------------------------------------------------------
describe('extractReleaseYear', () => {
  it('extracts year from full date "2024-03-15"', () => {
    expect(extractReleaseYear('2024-03-15')).toBe(2024);
  });

  it('extracts year from partial date "2024-03"', () => {
    expect(extractReleaseYear('2024-03')).toBe(2024);
  });

  it('extracts year from year-only "2024"', () => {
    expect(extractReleaseYear('2024')).toBe(2024);
  });

  it('returns undefined for year below 1500', () => {
    expect(extractReleaseYear('1400')).toBeUndefined();
  });

  it('returns undefined for year above 2100', () => {
    expect(extractReleaseYear('2200')).toBeUndefined();
  });

  it('returns undefined for garbage string', () => {
    expect(extractReleaseYear('not-a-date')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// extractTrackId
// ---------------------------------------------------------------------------
describe('extractTrackId', () => {
  it('extracts ID from standard Spotify URL', () => {
    expect(extractTrackId('https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp')).toBe(
      '3n3Ppam7vgaVa1iaRUc9Lp'
    );
  });

  it('extracts ID from URL with query params', () => {
    expect(extractTrackId('https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp?si=abc123')).toBe(
      '3n3Ppam7vgaVa1iaRUc9Lp'
    );
  });

  it('extracts ID from spotify: URI', () => {
    expect(extractTrackId('spotify:track:3n3Ppam7vgaVa1iaRUc9Lp')).toBe('3n3Ppam7vgaVa1iaRUc9Lp');
  });

  it('extracts bare 22-char Spotify ID', () => {
    expect(extractTrackId('3n3Ppam7vgaVa1iaRUc9Lp')).toBe('3n3Ppam7vgaVa1iaRUc9Lp');
  });

  it('returns null for invalid URL', () => {
    expect(extractTrackId('https://example.com/not-spotify')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractTrackId('')).toBeNull();
  });

  it('returns null for random garbage', () => {
    expect(extractTrackId('hello world')).toBeNull();
  });

  it('handles intl URL format', () => {
    expect(
      extractTrackId('https://open.spotify.com/intl-pl/track/5HNCy40Ni5BZJFw1TKzRsC?si=abc')
    ).toBe('5HNCy40Ni5BZJFw1TKzRsC');
  });
});

// ---------------------------------------------------------------------------
// mapSpotifyToSongDraft
// ---------------------------------------------------------------------------
describe('mapSpotifyToSongDraft', () => {
  const mockTrack: SpotifyApiTrack = {
    id: 'abc123',
    name: 'Wonderwall',
    artists: [{ name: 'Oasis' }],
    album: {
      name: 'Morning Glory',
      images: [{ url: 'https://i.scdn.co/image/cover.jpg' }],
      release_date: '1995-10-02',
    },
    external_urls: { spotify: 'https://open.spotify.com/track/abc123' },
    duration_ms: 258000,
  };

  const mockFeatures: SpotifyAudioFeatures = {
    key: 6,
    mode: 1,
    tempo: 87.5,
    time_signature: 4,
    duration_ms: 258000,
  };

  it('maps all fields from track + features', () => {
    const draft = mapSpotifyToSongDraft(mockTrack, mockFeatures);

    expect(draft).toEqual({
      title: 'Wonderwall',
      author: 'Oasis',
      spotify_link_url: 'https://open.spotify.com/track/abc123',
      cover_image_url: 'https://i.scdn.co/image/cover.jpg',
      duration_ms: 258000,
      release_year: 1995,
      key: 'F#',
      tempo: 88,
      time_signature: 4,
      is_draft: true,
      ultimate_guitar_link: null,
      youtube_url: null,
    });
  });

  it('handles multiple artists by joining with comma', () => {
    const multiArtistTrack: SpotifyApiTrack = {
      ...mockTrack,
      artists: [{ name: 'Artist A' }, { name: 'Artist B' }],
    };
    const draft = mapSpotifyToSongDraft(multiArtistTrack, null);
    expect(draft.author).toBe('Artist A, Artist B');
  });

  it('works without audio features (null)', () => {
    const draft = mapSpotifyToSongDraft(mockTrack, null);

    expect(draft.title).toBe('Wonderwall');
    expect(draft.author).toBe('Oasis');
    expect(draft.key).toBeUndefined();
    expect(draft.tempo).toBeUndefined();
    expect(draft.time_signature).toBeUndefined();
  });

  it('skips key when Spotify returns -1 (unknown)', () => {
    const unknownKeyFeatures: SpotifyAudioFeatures = {
      ...mockFeatures,
      key: -1,
    };
    const draft = mapSpotifyToSongDraft(mockTrack, unknownKeyFeatures);
    expect(draft.key).toBeUndefined();
  });

  it('maps minor key correctly', () => {
    const minorFeatures: SpotifyAudioFeatures = {
      ...mockFeatures,
      key: 9,
      mode: 0,
    };
    const draft = mapSpotifyToSongDraft(mockTrack, minorFeatures);
    expect(draft.key).toBe('Am');
  });

  it('rounds tempo to nearest integer', () => {
    const draft = mapSpotifyToSongDraft(mockTrack, { ...mockFeatures, tempo: 120.7 });
    expect(draft.tempo).toBe(121);
  });

  it('handles missing album images', () => {
    const noImageTrack: SpotifyApiTrack = {
      ...mockTrack,
      album: { ...mockTrack.album, images: [] },
    };
    const draft = mapSpotifyToSongDraft(noImageTrack, null);
    expect(draft.cover_image_url).toBeNull();
  });

  it('sets is_draft to true', () => {
    const draft = mapSpotifyToSongDraft(mockTrack, null);
    expect(draft.is_draft).toBe(true);
  });

  it('sets ultimate_guitar_link and youtube_url to null', () => {
    const draft = mapSpotifyToSongDraft(mockTrack, null);
    expect(draft.ultimate_guitar_link).toBeNull();
    expect(draft.youtube_url).toBeNull();
  });
});
