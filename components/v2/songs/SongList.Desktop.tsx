'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Music, Search, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { ListPageHeader } from '@/components/v2/primitives/ListPageHeader';
import { CollapsibleFilterBar } from '@/components/v2/primitives/CollapsibleFilterBar';
import { SongPreviewPanel } from './SongList.PreviewPanel';
import type { SongListV2Props } from './SongList';

type SortField = 'title' | 'author' | 'level' | 'key';
type SortDir = 'asc' | 'desc';

const LEVEL_STYLES: Record<string, string> = {
  beginner: 'bg-emerald-500/10 text-emerald-400',
  intermediate: 'bg-primary/15 text-primary',
  advanced: 'bg-destructive/10 text-red-400',
};

export default function SongListDesktop({ songs, isTeacher }: SongListV2Props) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    songs.forEach((s) => { if (s.category) cats.add(s.category); });
    return [...cats].sort().map((c) => ({ label: c, value: c }));
  }, [songs]);

  const filtered = useMemo(() => {
    let result = songs;
    if (categoryFilter) {
      result = result.filter((s) => s.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((s) => s.title?.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      const valA = (a[sortField] ?? '').toString().toLowerCase();
      const valB = (b[sortField] ?? '').toString().toLowerCase();
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [songs, search, sortField, sortDir, categoryFilter]);

  const selectedSong = useMemo(
    () => (selectedSongId ? songs.find((s) => s.id === selectedSongId) ?? null : null),
    [songs, selectedSongId]
  );

  return (
    <div className="space-y-6 px-6 lg:px-8 py-6">
      <ListPageHeader
        title="Songs"
        count={songs.length}
        countLabel={`song${songs.length !== 1 ? 's' : ''} in library`}
        action={isTeacher ? { label: 'New Song', href: '/dashboard/songs/new' } : undefined}
      />

      <div className="flex items-center gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search songs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-transparent focus:ring-1 focus:ring-primary/30" />
        </div>
      </div>

      {categories.length > 0 && (
        <CollapsibleFilterBar
          filters={categories}
          active={categoryFilter}
          onChange={setCategoryFilter}
          allLabel="All"
        />
      )}

      <div className={cn('grid gap-6', selectedSong ? 'grid-cols-1 xl:grid-cols-[1fr_380px]' : 'grid-cols-1')}>
        <SongsTable
          songs={filtered}
          sortField={sortField}
          sortDir={sortDir}
          selectedSongId={selectedSongId}
          onSort={toggleSort}
          onSelect={setSelectedSongId}
        />
        {selectedSong && <SongPreviewPanel song={selectedSong} onClose={() => setSelectedSongId(null)} />}
      </div>
    </div>
  );
}

function SongsTable({ songs, sortField, sortDir, selectedSongId, onSort, onSelect }: {
  songs: SongListV2Props['songs']; sortField: SortField; sortDir: SortDir;
  selectedSongId: string | null; onSort: (f: SortField) => void; onSelect: (id: string | null) => void;
}) {
  return (
    <div className="rounded-xl overflow-hidden bg-card shadow-2xl shadow-black/20">
      <Table>
        <TableHeader>
          <TableRow className="border-transparent">
            <SortHead field="title" current={sortField} dir={sortDir} onSort={onSort}>Song</SortHead>
            <SortHead field="author" current={sortField} dir={sortDir} onSort={onSort}>Artist</SortHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</TableHead>
            <SortHead field="level" current={sortField} dir={sortDir} onSort={onSort}>Level</SortHead>
            <SortHead field="key" current={sortField} dir={sortDir} onSort={onSort}>Key</SortHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {songs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="p-0">
                <EmptyState icon={Music} title="No songs found" message="Try adjusting your search or add a new song." />
              </TableCell>
            </TableRow>
          ) : songs.map((song) => (
            <SongRow key={song.id} song={song} selected={song.id === selectedSongId} onSelect={onSelect} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SongRow({ song, selected, onSelect }: {
  song: SongListV2Props['songs'][number]; selected: boolean; onSelect: (id: string | null) => void;
}) {
  return (
    <TableRow
      onClick={() => onSelect(selected ? null : song.id)}
      className={cn(
        'cursor-pointer transition-colors border-transparent',
        selected ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : 'hover:bg-muted/50'
      )}
    >
      <TableCell>
        <Link href={`/dashboard/songs/${song.id}`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="relative w-10 h-10 rounded-[10px] overflow-hidden shrink-0 bg-muted flex items-center justify-center">
            {song.cover_image_url ? (
              <Image src={song.cover_image_url} alt={song.title || 'Song'} fill sizes="40px" className="object-cover" />
            ) : (<Music className="h-4 w-4 text-muted-foreground" />)}
          </div>
          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{song.title || 'Untitled'}</span>
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">{song.author || 'Unknown'}</TableCell>
      <TableCell className="text-muted-foreground">{song.category || '-'}</TableCell>
      <TableCell>
        {song.level ? (
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', LEVEL_STYLES[song.level] ?? 'bg-muted text-muted-foreground')}>
            {song.level}
          </span>
        ) : <span className="text-muted-foreground">-</span>}
      </TableCell>
      <TableCell className="text-muted-foreground">{song.key || '-'}</TableCell>
    </TableRow>
  );
}

function SortHead({ field, current, dir, onSort, children }: {
  field: SortField; current: SortField; dir: SortDir; onSort: (f: SortField) => void; children: React.ReactNode;
}) {
  const isActive = current === field;
  return (
    <TableHead>
      <button type="button" onClick={() => onSort(field)} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
        {children}
        <ArrowUpDown className={cn('h-3.5 w-3.5 transition-opacity', isActive ? 'opacity-100' : 'opacity-40')} style={isActive && dir === 'desc' ? { transform: 'scaleY(-1)' } : undefined} />
      </button>
    </TableHead>
  );
}
