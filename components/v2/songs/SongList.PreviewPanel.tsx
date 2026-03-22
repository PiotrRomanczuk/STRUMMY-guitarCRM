'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X, Music, Play, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { SongWithStatus } from '@/components/songs/types';

const LEVEL_STYLES: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-400',
  intermediate: 'bg-primary/15 text-primary',
  advanced: 'bg-destructive/10 text-red-400',
};

interface SongPreviewPanelProps {
  song: SongWithStatus;
  onClose: () => void;
}

export function SongPreviewPanel({ song, onClose }: SongPreviewPanelProps) {
  const pills = [
    song.key && { label: song.key, title: 'Key' },
    song.tempo && { label: `${song.tempo} BPM`, title: 'Tempo' },
    song.capo_fret != null && song.capo_fret > 0 && { label: `Capo ${song.capo_fret}`, title: 'Capo' },
    song.level && { label: song.level, title: 'Level', className: LEVEL_STYLES[song.level] },
  ].filter(Boolean) as { label: string; title: string; className?: string }[];

  const externalLinks = [
    song.spotify_link_url && { href: song.spotify_link_url, label: 'Spotify' },
    song.youtube_url && { href: song.youtube_url, label: 'YouTube' },
    song.ultimate_guitar_link && { href: song.ultimate_guitar_link, label: 'Ultimate Guitar' },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <div className="sticky top-6 bg-card rounded-xl shadow-2xl shadow-black/20 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preview</h3>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <CoverImage song={song} />

      <div>
        <h2 className="font-bold text-lg text-foreground leading-tight">{song.title || 'Untitled'}</h2>
        <p className="text-sm text-muted-foreground">
          {[song.author, song.release_year].filter(Boolean).join(' · ') || 'Unknown artist'}
        </p>
      </div>

      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pills.map((pill) => (
            <span key={pill.title} className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
              pill.className ?? 'bg-muted text-muted-foreground'
            )}>{pill.label}</span>
          ))}
        </div>
      )}

      <PreviewDetails song={song} />

      <div className="flex items-center gap-2 pt-2 border-t border-border/10">
        <Button asChild size="sm" className="flex-1">
          <Link href={`/dashboard/songs/${song.id}`}>View Details</Link>
        </Button>
        {externalLinks.map((link) => (
          <Button key={link.label} variant="ghost" size="sm" asChild title={link.label}>
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}

function CoverImage({ song }: { song: SongWithStatus }) {
  return (
    <div className="relative aspect-video rounded-lg overflow-hidden bg-muted flex items-center justify-center">
      {song.cover_image_url ? (
        <Image src={song.cover_image_url} alt={song.title || 'Song'} fill sizes="380px" className="object-cover" />
      ) : (
        <Music className="h-10 w-10 text-muted-foreground/40" />
      )}
      {song.youtube_url && (
        <a href={song.youtube_url} target="_blank" rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
          <Play className="h-10 w-10 text-white fill-white" />
        </a>
      )}
    </div>
  );
}

function PreviewDetails({ song }: { song: SongWithStatus }) {
  const lyricsSnippet = song.lyrics_with_chords
    ? song.lyrics_with_chords.split('\n').slice(0, 4).join('\n')
    : null;

  return (
    <ScrollArea className="max-h-[calc(100vh-500px)]">
      <div className="space-y-4">
        {song.chords && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Chords</p>
            <div className="flex items-center gap-3 flex-wrap">
              {song.chords.split(/\s+/).map((c) => (
                <span key={c} className="font-mono text-base font-extrabold text-primary">{c}</span>
              ))}
            </div>
          </div>
        )}
        {song.strumming_pattern && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Strumming</p>
            <p className="font-mono text-sm text-foreground">{song.strumming_pattern}</p>
          </div>
        )}
        {lyricsSnippet && (
          <div className="relative">
            <p className="text-xs font-medium text-muted-foreground mb-1">Lyrics</p>
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed">{lyricsSnippet}</pre>
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent" />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
