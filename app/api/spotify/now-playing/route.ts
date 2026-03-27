import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/api-auth';
import { getCurrentlyPlaying } from '@/lib/spotify-user';

/**
 * GET /api/spotify/now-playing
 * Returns the currently playing Spotify track.
 * Requires API key or session auth.
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.status });
  }

  try {
    const track = await getCurrentlyPlaying();

    if (!track) {
      return NextResponse.json({ playing: false }, { status: 200 });
    }

    return NextResponse.json({ playing: true, track }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('SPOTIFY_USER_REFRESH_TOKEN')) {
      return NextResponse.json(
        { error: 'Spotify not connected. Visit /dashboard/admin/spotify-connect' },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
