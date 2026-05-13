import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { withApiAuth } from '@/lib/auth/withApiAuth';

const SCOPES = [
  'user-read-currently-playing',
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ');

/**
 * GET /api/spotify/authorize
 * Redirects to Spotify OAuth login page. Admin-only.
 */
export async function GET(request: Request) {
  return withApiAuth(request, async ({ roles }) => {
    if (!roles.isAdmin) {
      return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'SPOTIFY_CLIENT_ID and SPOTIFY_REDIRECT_URI must be set' },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: SCOPES,
      redirect_uri: redirectUri,
      show_dialog: 'true',
    });

    return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
  });
}
