'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X, Music, Play } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
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
    song.spotify_link_url && { href: song.spotify_link_url, label: 'Spotify', icon: <SpotifyIcon /> },
    song.youtube_url && { href: song.youtube_url, label: 'YouTube', icon: <YouTubeIcon /> },
    song.ultimate_guitar_link && { href: song.ultimate_guitar_link, label: 'Ultimate Guitar', icon: <UltimateGuitarIcon /> },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];

  return (
    <div className="sticky top-6 bg-card rounded-xl shadow-2xl shadow-black/20 p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Preview</h3>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={song.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
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
                  {link.icon}
                </a>
              </Button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
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

function SpotifyIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function UltimateGuitarIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.657 3.548c-2.027-1.077-4.478-1.413-6.781-.878C7.388 3.541 4.648 6.2 3.86 9.709a10.2 10.2 0 0 0 1.477 8.065c1.474 2.2 3.86 3.66 6.543 4.012a10.02 10.02 0 0 0 7.49-2.278c2.2-1.903 3.335-4.8 3.1-7.676-.117-1.47-.542-2.855-1.32-4.08L17.657 3.55zm-1.478 13.47c-1.232 1.147-2.93 1.68-4.596 1.503-1.667-.176-3.177-1.047-4.114-2.45a6.454 6.454 0 0 1-.938-5.127c.503-2.224 2.243-3.913 4.47-4.423 1.46-.334 2.98-.105 4.29.614l2.51 3.52c.452.722.69 1.5.76 2.328.146 1.813-.573 3.642-1.956 4.93z" />
    </svg>
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
