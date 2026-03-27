/**
 * Spotify user-level authentication (authorization_code flow).
 *
 * Uses SPOTIFY_USER_REFRESH_TOKEN to get fresh access tokens
 * for user-scoped endpoints like "currently playing".
 */

import { logger } from '@/lib/logger';

const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const PLAYER_ENDPOINT = 'https://api.spotify.com/v1/me/player/currently-playing';

let cachedUserToken: string | null = null;
let userTokenExpiration: number | null = null;

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  item: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string }[];
      release_date: string;
    };
    external_urls: { spotify: string };
    duration_ms: number;
  } | null;
  currently_playing_type: string;
}

function getClientCredentialsBase64(): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set');
  }
  return Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
}

/**
 * Get a fresh user-level access token using the stored refresh token.
 */
export async function getUserAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedUserToken && userTokenExpiration && now < userTokenExpiration) {
    return cachedUserToken;
  }

  const refreshToken = process.env.SPOTIFY_USER_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error(
      'SPOTIFY_USER_REFRESH_TOKEN is not set. Connect Spotify at /dashboard/admin/spotify-connect'
    );
  }

  const basic = getClientCredentialsBase64();

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('[spotify-user] Token refresh failed', {
      status: String(response.status),
      body: errorBody,
    });
    throw new Error(`Spotify token refresh failed: ${response.status}`);
  }

  const data = (await response.json()) as SpotifyTokenResponse;
  cachedUserToken = data.access_token;
  userTokenExpiration = now + data.expires_in * 1000 - 60000; // 60s buffer

  return data.access_token;
}

/**
 * Get the currently playing track from Spotify.
 * Returns null if nothing is playing.
 */
export async function getCurrentlyPlaying(): Promise<{
  id: string;
  title: string;
  artist: string;
  album: string;
  url: string;
  coverUrl: string | null;
  releaseDate: string;
  durationMs: number;
  isPlaying: boolean;
} | null> {
  const accessToken = await getUserAccessToken();

  const response = await fetch(PLAYER_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // 204 = no content (nothing playing)
  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    const errorBody = await response.text();
    logger.error('[spotify-user] Currently playing failed', {
      status: String(response.status),
      body: errorBody,
    });
    throw new Error(`Spotify currently-playing failed: ${response.status}`);
  }

  const data = (await response.json()) as SpotifyCurrentlyPlaying;

  if (!data.item || data.currently_playing_type !== 'track') {
    return null;
  }

  return {
    id: data.item.id,
    title: data.item.name,
    artist: data.item.artists.map((a) => a.name).join(', '),
    album: data.item.album.name,
    url: data.item.external_urls.spotify,
    coverUrl: data.item.album.images[0]?.url || null,
    releaseDate: data.item.album.release_date,
    durationMs: data.item.duration_ms,
    isPlaying: data.is_playing,
  };
}

/** Clear cached token (for testing). */
export function clearUserTokenCache(): void {
  cachedUserToken = null;
  userTokenExpiration = null;
}
