import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * GET /api/spotify/callback?code=...
 * Exchanges the OAuth authorization code for access + refresh tokens.
 * The refresh token is displayed for manual storage in env vars.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    logger.error('[spotify-callback] OAuth error', { error });
    return NextResponse.redirect(
      new URL(`/dashboard/admin/spotify-connect?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard/admin/spotify-connect?error=missing_code', request.url)
    );
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json({ error: 'Spotify credentials not configured' }, { status: 500 });
  }

  // Exchange code for tokens
  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const errorBody = await tokenResponse.text();
    logger.error('[spotify-callback] Token exchange failed', {
      status: String(tokenResponse.status),
      body: errorBody,
    });
    return NextResponse.redirect(
      new URL('/dashboard/admin/spotify-connect?error=token_exchange_failed', request.url)
    );
  }

  const tokenData = await tokenResponse.json();
  const refreshToken = tokenData.refresh_token;

  // Log the refresh token so the user can copy it
  logger.info('[spotify-callback] OAuth successful! Refresh token obtained.');
  console.log('\n===========================================');
  console.log('SPOTIFY_USER_REFRESH_TOKEN=' + refreshToken);
  console.log('===========================================\n');
  console.log('Add this to your .env.local and Vercel env vars.');

  // Redirect back with the token in the URL (only shown to admin)
  return NextResponse.redirect(
    new URL(
      `/dashboard/admin/spotify-connect?success=true&refresh_token=${encodeURIComponent(refreshToken)}`,
      request.url
    )
  );
}
