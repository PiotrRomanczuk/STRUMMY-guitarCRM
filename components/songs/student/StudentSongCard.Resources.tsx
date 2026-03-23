import Link from 'next/link';
import { ExternalLink, Youtube, Play, FileText, Music2 } from 'lucide-react';
import type { SongWithStatus as Song } from '@/components/songs/types';

interface StudentSongCardResourcesProps {
  song: Song;
}

export function StudentSongCardResources({ song }: StudentSongCardResourcesProps) {
  const hasResources =
    song.youtube_url || song.ultimate_guitar_link || song.spotify_link_url || song.audio_files;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-muted-foreground mb-2">Quick Resources</h4>

      {hasResources ? (
        <div className="grid grid-cols-2 gap-2">
          {song.youtube_url && (
            <a
              href={song.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-9 px-3 text-xs font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              <Youtube className="w-4 h-4" />
              YouTube
            </a>
          )}
          {song.ultimate_guitar_link && (
            <a
              href={song.ultimate_guitar_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-9 px-3 text-xs font-medium bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Tabs
            </a>
          )}
          {song.spotify_link_url && (
            <a
              href={song.spotify_link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-9 px-3 text-xs font-medium bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              <Play className="w-4 h-4" />
              Spotify
            </a>
          )}
          {song.audio_files && (
            <a
              href={Object.values(song.audio_files)[0] ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-9 px-3 text-xs font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Music2 className="w-4 h-4" />
              Audio
            </a>
          )}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground text-center py-2">
          No resources available yet
        </div>
      )}

      <Link
        href={`/dashboard/songs/${song.id}`}
        className="w-full inline-flex items-center justify-center h-9 px-4 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 transition-colors"
      >
        View Full Details
        <ExternalLink className="w-4 h-4 ml-2" />
      </Link>
    </div>
  );
}
