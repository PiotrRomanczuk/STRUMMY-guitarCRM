'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Music, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { BottomActionSheet } from '@/components/v2/primitives/BottomActionSheet';
import { InfoTab } from './SongDetail.InfoTab';
import { LyricsViewer } from './LyricsViewer';
import { VideoPlayer } from './VideoPlayer';
import type { SongDetailV2Props } from './SongDetail';

type Tab = 'info' | 'lyrics' | 'video';

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-500 ring-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-500 ring-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-500 ring-red-500/20',
};

export function SongDetailMobile({ song, isTeacher, onDelete }: SongDetailV2Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [showActions, setShowActions] = useState(false);

  if (!song) {
    return (
      <MobilePageShell title="Song not found">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center mb-4">
            <Music className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-1">Song not found</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            This song may have been deleted or you do not have permission to view it.
          </p>
          <Button size="sm" onClick={() => router.push('/dashboard/songs')}>Back to songs</Button>
        </div>
      </MobilePageShell>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Info' },
    ...(song.lyrics_with_chords ? [{ key: 'lyrics' as Tab, label: 'Lyrics' }] : []),
    ...(song.youtube_url ? [{ key: 'video' as Tab, label: 'Video' }] : []),
  ];

  return (
    <MobilePageShell
      title={song.title || 'Untitled'}
      subtitle={song.author || 'Unknown artist'}
      headerActions={isTeacher ? (
        <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] text-primary"
          onClick={() => setShowActions(true)} aria-label="Song actions">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      ) : undefined}
    >
      {/* Hero section */}
      <section>
        <div className="w-full h-[200px] bg-card rounded-xl flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-50" />
          {song.cover_image_url ? (
            <>
              <Image src={song.cover_image_url} alt={`${song.title} cover`} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </>
          ) : (
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center shadow-lg">
              <Music className="h-10 w-10 text-primary" />
            </div>
          )}
          {song.level && (
            <div className="absolute bottom-4 left-4">
              <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ring-1',
                LEVEL_COLORS[song.level.toLowerCase()] ?? 'bg-primary/10 text-primary ring-primary/20')}>
                {song.level}
              </span>
            </div>
          )}
        </div>
        <div className="mt-5">
          <h2 className="text-xl font-bold text-foreground leading-tight">{song.title || 'Untitled'}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{song.author || 'Unknown artist'}</p>
        </div>
      </section>

      {/* Tab bar */}
      {tabs.length > 1 && (
        <div className="flex border-b border-border/30 -mx-4 px-4 mt-4" role="tablist" aria-label="Song details">
          {tabs.map((tab) => (
            <button key={tab.key} type="button" role="tab" id={`tab-${tab.key}`}
              aria-selected={activeTab === tab.key} aria-controls={`tabpanel-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={cn('flex-1 py-3 text-sm font-bold text-center transition-colors min-h-[44px] relative',
                activeTab === tab.key ? 'text-primary' : 'text-muted-foreground hover:text-foreground')}>
              {tab.label}
              {activeTab === tab.key && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-primary" />}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'info' && <InfoTab song={song} />}
        {activeTab === 'lyrics' && <LyricsViewer text={song.lyrics_with_chords ?? ''} />}
        {activeTab === 'video' && <VideoPlayer url={song.youtube_url ?? ''} />}
      </div>

      {/* Actions sheet */}
      {isTeacher && (
        <BottomActionSheet open={showActions} onOpenChange={setShowActions}
          title="Song Actions" subtitle={song.title || 'Untitled'}
          actions={[
            { icon: <Pencil className="h-5 w-5" />, label: 'Edit Song',
              onClick: () => router.push(`/dashboard/songs/${song.id}/edit`) },
            { icon: <Trash2 className="h-5 w-5" />, label: 'Delete Song',
              onClick: () => onDelete?.(), variant: 'destructive' },
          ]}
        />
      )}
    </MobilePageShell>
  );
}
