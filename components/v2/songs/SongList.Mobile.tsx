'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { MobilePageShell } from '@/components/v2/primitives/MobilePageShell';
import { CollapsibleFilterBar } from '@/components/v2/primitives/CollapsibleFilterBar';
import { FloatingActionButton } from '@/components/v2/primitives/FloatingActionButton';
import { SwipeableListItem } from '@/components/v2/primitives/SwipeableListItem';
import { fastStaggerContainer, listItem, safeVariants } from '@/lib/animations/variants';
import type { SongListV2Props } from './SongList';
import type { SongWithStatus } from '@/components/songs/types';
import { SongListEmpty } from './SongList.Empty';

const LEVEL_FILTERS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

const LEVEL_BADGE_STYLES: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-400',
  intermediate: 'bg-primary/15 text-primary',
  advanced: 'bg-destructive/10 text-red-400',
};

export function SongListMobile({ songs, isTeacher, onRefresh }: SongListV2Props) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = songs;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) => s.title?.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q)
      );
    }
    if (levelFilter) result = result.filter((s) => s.level === levelFilter);
    return result;
  }, [songs, search, levelFilter]);

  return (
    <MobilePageShell
      title="Songs"
      subtitle={`${songs.length} song${songs.length !== 1 ? 's' : ''}`}
      showBack={false}
      fab={isTeacher ? (
        <FloatingActionButton
          onClick={() => router.push('/dashboard/songs/new')}
          label="Add new song"
          icon={<Plus className="h-6 w-6" />}
        />
      ) : undefined}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 min-h-[44px] text-base bg-card border-transparent focus:ring-1 focus:ring-primary/30"
        />
      </div>
      <CollapsibleFilterBar filters={LEVEL_FILTERS} active={levelFilter} onChange={setLevelFilter} />
      {filtered.length === 0 ? (
        <SongListEmpty isTeacher={isTeacher} hasFilters={!!search || !!levelFilter} />
      ) : (
        <motion.div variants={safeVariants(fastStaggerContainer)} initial="hidden" animate="visible" className="space-y-2">
          {filtered.map((song) => (
            <motion.div key={song.id} variants={safeVariants(listItem)}>
              <SongCard song={song} isTeacher={isTeacher} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </MobilePageShell>
  );
}

function SongCard({ song, isTeacher }: { song: SongWithStatus; isTeacher: boolean }) {
  const router = useRouter();
  return (
    <SwipeableListItem onEdit={isTeacher ? () => router.push(`/dashboard/songs/${song.id}/edit`) : undefined}>
      <Link
        href={`/dashboard/songs/${song.id}`}
        className="flex items-center gap-3 p-4 bg-card rounded-[10px] shadow-sm active:bg-muted transition-colors"
      >
        <div className="relative w-14 h-14 rounded-[10px] overflow-hidden shrink-0 bg-muted flex items-center justify-center">
          {song.cover_image_url ? (
            <Image src={song.cover_image_url} alt={song.title || 'Song cover'} fill sizes="56px" className="object-cover" />
          ) : (
            <Music className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{song.title || 'Untitled'}</p>
          <p className="text-xs text-muted-foreground truncate">{song.author || 'Unknown artist'}</p>
        </div>
        {song.level && (
          <span className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0',
            LEVEL_BADGE_STYLES[song.level] ?? 'bg-muted text-muted-foreground'
          )}>
            {song.level}
          </span>
        )}
      </Link>
    </SwipeableListItem>
  );
}
