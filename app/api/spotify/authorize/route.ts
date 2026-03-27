import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { createAdminClient } from '@/lib/supabase/admin';

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
  const auth = await authenticateRequest(request);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  // Admin check
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', auth.user.id)
    .single();

  if (!profile?.is_admin) {
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
}
