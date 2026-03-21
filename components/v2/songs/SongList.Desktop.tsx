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
import type { SongListV2Props } from './SongList';
import type { SongWithStatus } from '@/components/songs/types';

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

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let result = songs;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((s) => s.title?.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      const valA = (a[sortField] ?? '').toString().toLowerCase();
      const valB = (b[sortField] ?? '').toString().toLowerCase();
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [songs, search, sortField, sortDir]);

  return (
    <div className="space-y-6 px-6 lg:px-8 py-6">
      <ListPageHeader
        title="Songs"
        count={songs.length}
        countLabel={`song${songs.length !== 1 ? 's' : ''} in library`}
        action={isTeacher ? { label: 'New Song', href: '/dashboard/songs/new' } : undefined}
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search songs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-transparent focus:ring-1 focus:ring-primary/30" />
      </div>

      <div className="rounded-xl overflow-hidden bg-card shadow-2xl shadow-black/20">
        <Table>
          <TableHeader>
            <TableRow className="border-transparent">
              <SortHead field="title" current={sortField} dir={sortDir} onSort={toggleSort}>Song</SortHead>
              <SortHead field="author" current={sortField} dir={sortDir} onSort={toggleSort}>Artist</SortHead>
              <SortHead field="level" current={sortField} dir={sortDir} onSort={toggleSort}>Level</SortHead>
              <SortHead field="key" current={sortField} dir={sortDir} onSort={toggleSort}>Key</SortHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="p-0">
                  <EmptyState
                    icon={Music}
                    title="No songs found"
                    message="Try adjusting your search or add a new song."
                  />
                </TableCell>
              </TableRow>
            ) : filtered.map((song) => (
              <TableRow key={song.id} className="hover:bg-muted/50 transition-colors group border-transparent">
                <TableCell>
                  <Link href={`/dashboard/songs/${song.id}`} className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-[10px] overflow-hidden shrink-0 bg-muted flex items-center justify-center">
                      {song.cover_image_url ? (
                        <Image src={song.cover_image_url} alt={song.title || 'Song'} fill sizes="40px" className="object-cover" />
                      ) : (<Music className="h-4 w-4 text-muted-foreground" />)}
                    </div>
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{song.title || 'Untitled'}</span>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{song.author || 'Unknown'}</TableCell>
                <TableCell>
                  {song.level ? (
                    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider', LEVEL_STYLES[song.level] ?? 'bg-muted text-muted-foreground')}>
                      {song.level}
                    </span>
                  ) : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="text-muted-foreground">{song.key || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
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
