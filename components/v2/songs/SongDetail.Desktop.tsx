'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Music,
  Pencil,
  Trash2,
  Timer,
  Waves,
  Guitar,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LyricsViewer } from './LyricsViewer';
import { VideoPlayer } from './VideoPlayer';
import type { SongDetailV2Props } from './SongDetail';

export default function SongDetailDesktop({
  song,
  isTeacher,
  onDelete,
}: SongDetailV2Props) {
  const router = useRouter();

  if (!song) {
    return (
      <div className="px-8 py-8">
        <Card className="max-w-lg mx-auto">
          <CardContent className="py-16 text-center">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Song not found</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This song may have been deleted or you do not have permission.
            </p>
            <Button asChild>
              <Link href="/dashboard/songs">Back to songs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {song.cover_image_url && (
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
              <Image
                src={song.cover_image_url}
                alt={`${song.title} cover`}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{song.title || 'Untitled'}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {song.author || 'Unknown artist'}
              {song.release_year ? ` (${song.release_year})` : ''}
            </p>
          </div>
        </div>
        {isTeacher && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/songs/${song.id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {song.lyrics_with_chords && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Lyrics & Chords</CardTitle>
              </CardHeader>
              <CardContent>
                <LyricsViewer text={song.lyrics_with_chords} />
              </CardContent>
            </Card>
          )}

          {song.youtube_url && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Video</CardTitle>
              </CardHeader>
              <CardContent>
                <VideoPlayer url={song.youtube_url} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {song.key && <MetaRow icon={<Guitar />} label="Key" value={song.key} />}
              {song.tempo && <MetaRow icon={<Timer />} label="Tempo" value={`${song.tempo} BPM`} />}
              {song.level && <MetaRow icon={<Music />} label="Level" value={song.level} />}
              {song.category && <MetaRow icon={<Tag />} label="Category" value={song.category} />}
              {song.capo_fret != null && (
                <MetaRow
                  icon={<Music />}
                  label="Capo"
                  value={song.capo_fret === 0 ? 'No capo' : `Fret ${song.capo_fret}`}
                />
              )}
              {song.strumming_pattern && (
                <MetaRow icon={<Waves />} label="Strumming" value={song.strumming_pattern} />
              )}
              {song.chords && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Chords</p>
                  <p className="text-sm font-mono text-foreground">{song.chords}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* External links */}
          <DesktopExternalLinks song={song} />
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function DesktopExternalLinks({ song }: { song: NonNullable<SongDetailV2Props['song']> }) {
  const links = [
    song.spotify_link_url && { href: song.spotify_link_url, label: 'Spotify' },
    song.ultimate_guitar_link && { href: song.ultimate_guitar_link, label: 'Ultimate Guitar' },
    song.tiktok_short_url && { href: song.tiktok_short_url, label: 'TikTok' },
  ].filter(Boolean) as { href: string; label: string }[];

  if (links.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {links.map((link) => (
          <Button
            key={link.label}
            variant="outline"
            className="w-full justify-start"
            asChild
          >
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              {link.label}
            </a>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
