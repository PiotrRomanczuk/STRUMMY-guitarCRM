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
    <div className="space-y-3">
      {/* Metadata grid */}
      {metaItems.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {metaItems.map((item) => (
            <div
              key={item.label}
              className="bg-card rounded-xl p-4 flex flex-col justify-between h-[84px] hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                <span className="text-primary/60 [&_svg]:h-[18px] [&_svg]:w-[18px]">{item.icon}</span>
              </div>
              <p className="text-base font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Strumming pattern */}
      {song.strumming_pattern && (
        <div className="bg-card rounded-xl p-4 space-y-2 hover:bg-muted transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Strumming Pattern</span>
            <Waves className="h-[18px] w-[18px] text-primary/60" />
          </div>
          <p className="font-mono text-base tracking-[0.2em] font-bold text-foreground">
            {song.strumming_pattern}
          </p>
        </div>
      )}

      {/* Chords */}
      {song.chords && (
        <div className="bg-card rounded-xl p-4 space-y-2 hover:bg-muted transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Chords</span>
          </div>
          <div className="flex items-center gap-4">
            {song.chords.split(/\s+/).map((chord) => (
              <span key={chord} className="font-mono text-lg font-extrabold text-primary">
                {chord}
              </span>
            ))}
          </div>
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
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Quick Links
      </p>
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
