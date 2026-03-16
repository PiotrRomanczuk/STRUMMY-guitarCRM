'use client';

import {
  Music,
  Timer,
  Waves,
  Guitar,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Song } from '@/components/songs/types';

interface InfoTabProps {
  song: Song;
}

export function InfoTab({ song }: InfoTabProps) {
  const metaItems = [
    song.key && { icon: <Guitar className="h-3.5 w-3.5" />, label: 'Key', value: song.key },
    song.tempo && { icon: <Timer className="h-3.5 w-3.5" />, label: 'Tempo', value: `${song.tempo} BPM` },
    song.category && { icon: <Tag className="h-3.5 w-3.5" />, label: 'Category', value: song.category },
    song.capo_fret != null && {
      icon: <Music className="h-3.5 w-3.5" />,
      label: 'Capo',
      value: song.capo_fret === 0 ? 'No capo' : `Fret ${song.capo_fret}`,
    },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  return (
    <div className="space-y-4">
      {/* Metadata grid */}
      {metaItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {metaItems.map((item) => (
            <div
              key={item.label}
              className="bg-muted/50 rounded-lg p-3 border border-border"
            >
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Strumming pattern */}
      {song.strumming_pattern && (
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
            <Waves className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Strumming</span>
          </div>
          <p className="text-sm font-semibold text-foreground font-mono">
            {song.strumming_pattern}
          </p>
        </div>
      )}

      {/* Chords */}
      {song.chords && (
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">Chords</p>
          <p className="text-sm font-mono text-foreground">{song.chords}</p>
        </div>
      )}

      {/* External links */}
      <ExternalLinks song={song} />
    </div>
  );
}

function ExternalLinks({ song }: { song: Song }) {
  const links = [
    song.spotify_link_url && { href: song.spotify_link_url, label: 'Spotify' },
    song.ultimate_guitar_link && { href: song.ultimate_guitar_link, label: 'Ultimate Guitar' },
    song.tiktok_short_url && { href: song.tiktok_short_url, label: 'TikTok' },
  ].filter(Boolean) as { href: string; label: string }[];

  if (links.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">External Resources</p>
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <Button key={link.label} variant="outline" size="sm" asChild className="min-h-[44px]">
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              {link.label}
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}
