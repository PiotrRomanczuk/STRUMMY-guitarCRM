'use client';

import Link from 'next/link';
import { ExternalLink, Youtube, Play, FileText, Music2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Song, SongWithStatus } from '@/components/songs/types';

interface SongExpandedLayerProps {
  song: Song | SongWithStatus;
  onAssignClick: (song: Song) => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface MetadataItemProps {
  label: string;
  value: string;
}

function MetadataItem({ label, value }: MetadataItemProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-foreground truncate">{value}</span>
    </div>
  );
}

export default function SongExpandedLayer({ song, onAssignClick }: SongExpandedLayerProps) {
  const hasResources =
    song.youtube_url || song.ultimate_guitar_link || song.spotify_link_url || song.audio_files;

  const metadataItems: { label: string; value: string }[] = [];

  if (song.chords) metadataItems.push({ label: 'Chords', value: song.chords });
  if (song.strumming_pattern)
    metadataItems.push({ label: 'Strumming', value: song.strumming_pattern });
  if (song.tempo) metadataItems.push({ label: 'Tempo', value: `${song.tempo} BPM` });
  if (song.capo_fret != null && song.capo_fret > 0)
    metadataItems.push({ label: 'Capo', value: `Fret ${song.capo_fret}` });
  if (song.category) metadataItems.push({ label: 'Genre', value: song.category });
  if (song.release_year) metadataItems.push({ label: 'Year', value: String(song.release_year) });
  if (song.duration_ms)
    metadataItems.push({ label: 'Duration', value: formatDuration(song.duration_ms) });
  if (song.time_signature)
    metadataItems.push({ label: 'Time Sig', value: `${song.time_signature}/4` });

  return (
    <div
      className="px-4 pb-4 pt-2 space-y-3 border-t border-border"
      onClick={(e) => e.stopPropagation()}
    >
      {metadataItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metadataItems.map((item) => (
            <MetadataItem key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      )}

      {hasResources && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              href={
                (Object.values(song.audio_files as Record<string, string>)[0] as string) ?? '#'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-9 px-3 text-xs font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Music2 className="w-4 h-4" />
              Audio
            </a>
          )}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <Button asChild className="flex-1">
          <Link href={`/dashboard/songs/${song.id}`}>
            View Details
            <ExternalLink className="w-4 h-4 ml-2" />
          </Link>
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => onAssignClick(song)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Assign to Lesson
        </Button>
      </div>
    </div>
  );
}
