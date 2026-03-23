'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Music, Search, Plus } from 'lucide-react';
import type { StudentRepertoireWithSong } from '@/types/StudentRepertoire';
import { AddSongToRepertoireDialog } from './AddSongToRepertoireDialog';
import { EditSongConfigDialog } from './EditSongConfigDialog';
import { RepertoireCard } from './RepertoireCard';
import { groupRepertoireItems } from './repertoire.helpers';

interface UserRepertoireTabProps {
  userId: string;
  repertoire: StudentRepertoireWithSong[];
  viewMode?: 'teacher' | 'student';
}

export default function UserRepertoireTab({ userId, repertoire, viewMode = 'teacher' }: UserRepertoireTabProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<string>('priority');
  const [editingItem, setEditingItem] = useState<StudentRepertoireWithSong | null>(null);

  const filtered = repertoire.filter((item) => {
    const matchesSearch =
      !search ||
      item.song.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.song.author ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.current_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const grouped = groupRepertoireItems(filtered, groupBy);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search songs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search repertoire"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="to_learn">To Learn</SelectItem>
              <SelectItem value="started">Started</SelectItem>
              <SelectItem value="remembered">Remembered</SelectItem>
              <SelectItem value="with_author">Play Along</SelectItem>
              <SelectItem value="mastered">Mastered</SelectItem>
            </SelectContent>
          </Select>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="none">No Grouping</SelectItem>
            </SelectContent>
          </Select>
          <AddSongToRepertoireDialog studentId={userId}>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Song</span>
            </Button>
          </AddSongToRepertoireDialog>
        </div>
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Music className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-foreground font-medium">No songs in repertoire</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add songs to start tracking this student&apos;s progress.
            </p>
            <AddSongToRepertoireDialog studentId={userId}>
              <Button variant="outline" className="mt-4 gap-1">
                <Plus className="h-4 w-4" />
                Add First Song
              </Button>
            </AddSongToRepertoireDialog>
          </CardContent>
        </Card>
      ) : (
        grouped.map((group) => (
          <div key={group.label} className="space-y-2">
            {group.label !== 'ungrouped' && (
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                {group.label}
                <span className="text-xs font-normal">({group.items.length})</span>
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => (
                <RepertoireCard
                  key={item.id}
                  item={item}
                  studentId={userId}
                  onEditConfig={() => setEditingItem(item)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {editingItem && (
        <EditSongConfigDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
        />
      )}
    </div>
  );
}
