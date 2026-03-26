/**
 * Maps Spotify API data to the SongDraftSchema format.
 *
 * Spotify returns key as pitch class (0-11) and mode (0=minor, 1=major).
 * This module converts those to the MusicKeyEnum values used in the app.
 */

import type { SpotifyApiTrack } from '@/types/spotify';

/** Spotify pitch class → note name */
const PITCH_CLASS_MAP: Record<number, string> = {
  0: 'C',
  1: 'C#',
  2: 'D',
  3: 'D#',
  4: 'E',
  5: 'F',
  6: 'F#',
  7: 'G',
  8: 'G#',
  9: 'A',
  10: 'A#',
  11: 'B',
};

export interface SpotifyAudioFeatures {
  key: number;
  mode: number;
  tempo: number;
  time_signature: number;
  duration_ms: number;
}

/**
 * Convert Spotify pitch class (0-11) + mode (0=minor, 1=major) to MusicKeyEnum.
 * Returns undefined if key is -1 (unknown) or out of range.
 */
export function mapSpotifyKey(pitchClass: number, mode: number): string | undefined {
  const note = PITCH_CLASS_MAP[pitchClass];
  if (!note) return undefined;
  return mode === 0 ? `${note}m` : note;
}

/**
 * Extract release year from Spotify date string.
 * Spotify returns "2024", "2024-03", or "2024-03-15".
 */
export function extractReleaseYear(releaseDate: string): number | undefined {
  const year = parseInt(releaseDate, 10);
  if (isNaN(year) || year < 1500 || year > 2100) return undefined;
  return year;
}

/**
 * Extract Spotify track ID from various URL formats:
 * - https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp
 * - https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp?si=...
 * - spotify:track:3n3Ppam7vgaVa1iaRUc9Lp
 */
export function extractTrackId(url: string): string | null {
  if (url.startsWith('spotify:track:')) {
    return url.split(':')[2] || null;
  }

  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/track\/([a-zA-Z0-9]+)/);
    if (pathMatch) {
      return pathMatch[1];
    }
  } catch {
    // Invalid URL — try bare ID extraction
    const directMatch = url.match(/^[a-zA-Z0-9]{22}$/);
    if (directMatch) {
      return directMatch[0];
    }
  }

  return null;
}

/**
 * Map Spotify track + audio features to a song draft payload.
 */
export function mapSpotifyToSongDraft(
  track: SpotifyApiTrack,
  features: SpotifyAudioFeatures | null
) {
  const draft: Record<string, unknown> = {
    title: track.name,
    author: track.artists.map((a) => a.name).join(', '),
    spotify_link_url: track.external_urls.spotify,
    cover_image_url: track.album.images[0]?.url || null,
    duration_ms: track.duration_ms,
    is_draft: true,
    // Fields we can't get from Spotify — left for the teacher
    ultimate_guitar_link: null,
    youtube_url: null,
  };

  const releaseYear = extractReleaseYear(track.album.release_date);
  if (releaseYear) {
    draft.release_year = releaseYear;
  }

  if (features) {
    const key = mapSpotifyKey(features.key, features.mode);
    if (key) {
      draft.key = key;
    }

    if (features.tempo > 0) {
      draft.tempo = Math.round(features.tempo);
    }

    if (features.time_signature > 0) {
      draft.time_signature = features.time_signature;
    }
  }

  return draft;
}
