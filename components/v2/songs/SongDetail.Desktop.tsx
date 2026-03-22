'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Music, Pencil, Trash2, Timer, Waves, Guitar, Tag, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LyricsViewer } from './LyricsViewer';
import { VideoPlayer } from './VideoPlayer';
import { SongDetailRelatedStudents } from './SongDetail.RelatedStudents';
import type { SongDetailV2Props } from './SongDetail';

export default function SongDetailDesktop({ song, isTeacher, onDelete }: SongDetailV2Props) {
  const router = useRouter();

  if (!song) {
    return (
      <div className="px-8 py-8">
        <div className="max-w-lg mx-auto bg-card rounded-xl p-16 text-center">
          <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Song not found</h2>
          <p className="text-sm text-muted-foreground mb-6">This song may have been deleted or you do not have permission.</p>
          <Button asChild><Link href="/dashboard/songs">Back to songs</Link></Button>
        </div>
      </div>
    );
  }

  const levelColors: Record<string, string> = {
    beginner: 'bg-green-500/10 text-green-500 ring-green-500/20',
    intermediate: 'bg-yellow-500/10 text-yellow-500 ring-yellow-500/20',
    advanced: 'bg-red-500/10 text-red-500 ring-red-500/20',
  };

  return (
    <div className="px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-card shrink-0 flex items-center justify-center">
            {song.cover_image_url ? (
              <Image src={song.cover_image_url} alt={`${song.title} cover`} fill className="object-cover" priority />
            ) : (
              <Music className="h-8 w-8 text-primary/60" />
            )}
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{song.title || 'Untitled'}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {song.author || 'Unknown artist'}{song.release_year ? ` (${song.release_year})` : ''}
            </p>
            {song.level && (
              <span className={cn('inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ring-1',
                levelColors[song.level.toLowerCase()] ?? 'bg-primary/10 text-primary ring-primary/20')}>
                {song.level}
              </span>
            )}
          </div>
        </div>
        {isTeacher && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/dashboard/songs/${song.id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />Edit
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </Button>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {song.lyrics_with_chords && (
            <div className="bg-card rounded-xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Lyrics & Chords</h3>
              <LyricsViewer text={song.lyrics_with_chords} />
            </div>
          )}
          {song.youtube_url && (
            <div className="bg-card rounded-xl p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Video</h3>
              <VideoPlayer url={song.youtube_url} />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Details</h3>
            {song.key && <MetaRow icon={<Guitar />} label="Key" value={song.key} />}
            {song.tempo && <MetaRow icon={<Timer />} label="Tempo" value={`${song.tempo} BPM`} />}
            {song.category && <MetaRow icon={<Tag />} label="Category" value={song.category} />}
            {song.capo_fret != null && (
              <MetaRow icon={<Music />} label="Capo" value={song.capo_fret === 0 ? 'No capo' : `Fret ${song.capo_fret}`} />
            )}
            {song.strumming_pattern && <MetaRow icon={<Waves />} label="Strumming" value={song.strumming_pattern} />}
            {song.chords && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Chords</p>
                <div className="flex items-center gap-3">
                  {song.chords.split(/\s+/).map((c) => (
                    <span key={c} className="font-mono text-base font-extrabold text-primary">{c}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DesktopLinks song={song} />
          <SongDetailRelatedStudents songId={song.id} />
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span className="[&_svg]:h-4 [&_svg]:w-4 text-primary/60">{icon}</span>
        <span className="text-sm">{label}</span>
      </span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>);
}

function DesktopLinks({ song }: { song: NonNullable<SongDetailV2Props['song']> }) {
  const links = [
    song.spotify_link_url && { href: song.spotify_link_url, label: 'Spotify' },
    song.ultimate_guitar_link && { href: song.ultimate_guitar_link, label: 'Ultimate Guitar' },
    song.tiktok_short_url && { href: song.tiktok_short_url, label: 'TikTok' },
  ].filter(Boolean) as { href: string; label: string }[];
  if (!links.length) return null;
  return (
    <div className="bg-card rounded-xl p-6 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Resources</h3>
      <div className="space-y-2">
        {links.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
            className="w-full h-12 bg-muted hover:bg-muted/80 transition-colors rounded-xl flex items-center justify-between px-5">
            <span className="text-sm font-medium text-foreground">{link.label}</span>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </a>
        ))}
      </div>
    </div>
  );
}
