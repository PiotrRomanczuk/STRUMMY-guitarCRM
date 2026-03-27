'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Music, Loader2, ExternalLink } from 'lucide-react';

interface NowPlayingTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  url: string;
  coverUrl: string | null;
  isPlaying: boolean;
}

export function SpotifyConnectClient() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const refreshToken = searchParams.get('refresh_token');
  const error = searchParams.get('error');

  const [nowPlaying, setNowPlaying] = useState<NowPlayingTrack | null>(null);
  const [npLoading, setNpLoading] = useState(false);
  const [npError, setNpError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // Check connection on mount
  useEffect(() => {
    checkNowPlaying();
  }, []);

  async function checkNowPlaying() {
    setNpLoading(true);
    setNpError(null);
    try {
      const res = await fetch('/api/spotify/now-playing');
      const data = await res.json();

      if (res.status === 503) {
        setConnected(false);
        setNpError('Spotify not connected');
        return;
      }

      setConnected(true);

      if (data.playing) {
        setNowPlaying(data.track);
      } else {
        setNowPlaying(null);
        setNpError('Nothing playing on Spotify');
      }
    } catch (err) {
      setNpError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setNpLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Music className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Spotify Connection</h1>
      </div>

      {/* OAuth callback result */}
      {success && refreshToken && (
        <Card className="border-green-300 dark:border-green-800">
          <CardContent className="space-y-3 py-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="font-medium text-green-700 dark:text-green-300">Spotify connected!</p>
            </div>
            <p className="text-muted-foreground text-sm">
              Add this to your <code>.env.local</code> and Vercel env vars:
            </p>
            <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
              SPOTIFY_USER_REFRESH_TOKEN={refreshToken}
            </pre>
            <p className="text-muted-foreground text-xs">
              Then restart the dev server. This token doesn&apos;t expire.
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-300 dark:border-red-800">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <p className="text-red-700 dark:text-red-300">OAuth error: {error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            Connection Status
            <Badge variant={connected ? 'default' : 'secondary'}>
              {connected ? 'Connected' : 'Not Connected'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!connected && (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Connect your Spotify account to enable &quot;Send to Strummy&quot; — it reads what
                you&apos;re currently playing and creates a draft song.
              </p>
              <Button asChild>
                <a href="/api/spotify/authorize">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Connect Spotify
                </a>
              </Button>
            </div>
          )}

          {connected && (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Your Spotify account is connected. The &quot;Send to Strummy&quot; shortcut can now
                read your currently playing track.
              </p>
              <Button variant="outline" onClick={checkNowPlaying} disabled={npLoading}>
                {npLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Test Now Playing
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Now Playing */}
      {nowPlaying && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Currently Playing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {nowPlaying.coverUrl && (
                <img
                  src={nowPlaying.coverUrl}
                  alt="Album cover"
                  className="h-20 w-20 rounded-lg shadow"
                />
              )}
              <div>
                <p className="text-lg font-semibold">{nowPlaying.title}</p>
                <p className="text-muted-foreground">{nowPlaying.artist}</p>
                <p className="text-muted-foreground text-sm">{nowPlaying.album}</p>
                <Badge variant={nowPlaying.isPlaying ? 'default' : 'secondary'} className="mt-1">
                  {nowPlaying.isPlaying ? 'Playing' : 'Paused'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {npError && !nowPlaying && connected && (
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-muted-foreground">{npError}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
