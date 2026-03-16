'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Music, Search, Plus, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SongListV2Props } from './SongList';
import type { SongWithStatus } from '@/components/songs/types';

type SortField = 'title' | 'author' | 'level' | 'key';
type SortDir = 'asc' | 'desc';

export default function SongListDesktop({ songs, isTeacher }: SongListV2Props) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let result = songs;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) => s.title?.toLowerCase().includes(q) || s.author?.toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) => {
      const valA = (a[sortField] ?? '').toString().toLowerCase();
      const valB = (b[sortField] ?? '').toString().toLowerCase();
      return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [songs, search, sortField, sortDir]);

  return (
    <div className="space-y-6 px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Songs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {songs.length} song{songs.length !== 1 ? 's' : ''} in library
          </p>
        </div>
        {isTeacher && (
          <Button asChild>
            <Link href="/dashboard/songs/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Song
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search songs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <SortableHead field="title" current={sortField} dir={sortDir} onSort={toggleSort}>
                Song
              </SortableHead>
              <SortableHead field="author" current={sortField} dir={sortDir} onSort={toggleSort}>
                Artist
              </SortableHead>
              <SortableHead field="level" current={sortField} dir={sortDir} onSort={toggleSort}>
                Level
              </SortableHead>
              <SortableHead field="key" current={sortField} dir={sortDir} onSort={toggleSort}>
                Key
              </SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                  No songs found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((song) => <DesktopRow key={song.id} song={song} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function DesktopRow({ song }: { song: SongWithStatus }) {
  return (
    <TableRow className="hover:bg-muted/50 transition-colors group">
      <TableCell>
        <Link href={`/dashboard/songs/${song.id}`} className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-md overflow-hidden shrink-0 bg-muted flex items-center justify-center border border-border">
            {song.cover_image_url ? (
              <Image
                src={song.cover_image_url}
                alt={song.title || 'Song'}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <Music className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
            {song.title || 'Untitled'}
          </span>
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {song.author || 'Unknown'}
      </TableCell>
      <TableCell>
        <LevelPill level={song.level} />
      </TableCell>
      <TableCell className="text-muted-foreground">{song.key || '-'}</TableCell>
    </TableRow>
  );
}

const LEVEL_STYLES: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
  intermediate: 'bg-primary/10 text-primary border-primary/20',
  advanced: 'bg-destructive/10 text-destructive border-destructive/20',
};

function LevelPill({ level }: { level?: string | null }) {
  if (!level) return <span className="text-muted-foreground">-</span>;
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
      LEVEL_STYLES[level] ?? 'bg-muted text-muted-foreground border-border'
    )}>
      {level}
    </span>
  );
}

interface SortableHeadProps {
  field: SortField;
  current: SortField;
  dir: SortDir;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

function SortableHead({ field, current, dir, onSort, children }: SortableHeadProps) {
  const isActive = current === field;
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        {children}
        <ArrowUpDown
          className={cn(
            'h-3.5 w-3.5 transition-opacity',
            isActive ? 'opacity-100' : 'opacity-40'
          )}
          style={isActive && dir === 'desc' ? { transform: 'scaleY(-1)' } : undefined}
        />
      </button>
    </TableHead>
  );
}
