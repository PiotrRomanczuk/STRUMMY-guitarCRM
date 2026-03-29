'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
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
import {
  Music,
  Search,
  Plus,
  CalendarPlus,
  Settings,
  Loader2,
  Clock,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/v2/primitives/StatusBadge';
import {
  REPERTOIRE_STATUS_STYLES,
  REPERTOIRE_STATUS_LABELS,
} from '@/components/v2/repertoire/repertoire.styles';
import { addSongToNextLessonAction } from '@/app/actions/repertoire';
import type { StudentRepertoireWithSong } from '@/types/StudentRepertoire';
import { AddSongToRepertoireDialog } from './AddSongToRepertoireDialog';
import { EditSongConfigDialog } from './EditSongConfigDialog';
import { groupRepertoireItems } from './repertoire.helpers';

const STATUS_LEFT_BORDER: Record<string, string> = {
  mastered: 'border-l-green-500',
  with_author: 'border-l-blue-500',
  remembered: 'border-l-yellow-500',
  started: 'border-l-purple-500',
  to_learn: 'border-l-gray-300 dark:border-l-gray-600',
};

const DIFFICULTY_LABELS = ['', 'Easy', 'Medium', 'Hard', 'Very Hard', 'Expert'];

interface UserRepertoireTabProps {
  userId: string;
  repertoire: StudentRepertoireWithSong[];
  viewMode?: 'teacher' | 'student';
}

export default function UserRepertoireTab({
  userId,
  repertoire,
  viewMode = 'teacher',
}: UserRepertoireTabProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<string>('priority');
  const [editingItem, setEditingItem] =
    useState<StudentRepertoireWithSong | null>(null);

  const filtered = repertoire.filter((item) => {
    const matchesSearch =
      !search ||
      item.song.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.song.author ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || item.current_status === filterStatus;
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
            <p className="text-foreground font-medium">
              No songs in repertoire
            </p>
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
          <div key={group.label} className="space-y-1.5">
            {group.label !== 'ungrouped' && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 pt-2">
                {group.label}
                <span className="text-[10px] font-normal text-muted-foreground/60">
                  ({group.items.length})
                </span>
              </h3>
            )}
            <div className="rounded-xl overflow-hidden bg-card border border-border/50">
              {group.items.map((item, idx) => (
                <RepertoireRow
                  key={item.id}
                  item={item}
                  studentId={userId}
                  onEditConfig={() => setEditingItem(item)}
                  viewMode={viewMode}
                  isLast={idx === group.items.length - 1}
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

function RepertoireRow({
  item,
  studentId,
  onEditConfig,
  isLast,
}: {
  item: StudentRepertoireWithSong;
  studentId: string;
  onEditConfig: () => void;
  viewMode?: 'teacher' | 'student';
  isLast: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleAddToLesson = () => {
    startTransition(async () => {
      const result = await addSongToNextLessonAction(studentId, item.song_id);
      if ('error' in result) {
        toast.error(result.error);
      } else if ('noLesson' in result) {
        toast.info('No upcoming lesson scheduled');
      } else if ('alreadyInLesson' in result) {
        toast.info(`Already in next lesson`);
      } else {
        const date = new Date(result.scheduledAt).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        toast.success(`Added to lesson on ${date}`);
      }
    });
  };

  const practiceHours = item.total_practice_minutes
    ? Math.floor(item.total_practice_minutes / 60)
    : 0;
  const practiceRemainder = item.total_practice_minutes
    ? item.total_practice_minutes % 60
    : 0;
  const practiceDisplay = item.total_practice_minutes
    ? practiceHours > 0
      ? `${practiceHours}h ${practiceRemainder}m`
      : `${practiceRemainder}m`
    : null;

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 border-l-3 ${STATUS_LEFT_BORDER[item.current_status] || ''} hover:bg-muted/40 transition-colors ${!isLast ? 'border-b border-border/40' : ''}`}
    >
      {/* Song info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/songs/${item.song_id}`}
            className="font-medium text-sm hover:text-primary transition-colors truncate"
          >
            {item.song.title}
          </Link>
          <StatusBadge
            status={item.current_status}
            styleMap={REPERTOIRE_STATUS_STYLES}
            labelMap={REPERTOIRE_STATUS_LABELS}
            className="text-[10px] shrink-0"
          />
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {item.song.author}
          {item.preferred_key && (
            <span className="ml-2 font-mono text-[10px] bg-muted/60 px-1 rounded">
              Key: {item.preferred_key}
            </span>
          )}
          {item.capo_fret !== null && item.capo_fret > 0 && (
            <span className="ml-1 text-[10px] bg-muted/60 px-1 rounded">
              Capo {item.capo_fret}
            </span>
          )}
        </p>
      </div>

      {/* Practice stats */}
      <div className="hidden md:flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
        {practiceDisplay && (
          <span className="flex items-center gap-1" title="Total practice time">
            <Clock className="h-3 w-3" />
            {practiceDisplay}
          </span>
        )}
        {item.difficulty_rating && (
          <span
            className="flex items-center gap-0.5"
            title={DIFFICULTY_LABELS[item.difficulty_rating]}
          >
            <Flame className="h-3 w-3" />
            <span className="flex gap-px">
              {[1, 2, 3, 4, 5].map((level) => (
                <span
                  key={level}
                  className={`w-1.5 h-3 rounded-sm ${
                    level <= item.difficulty_rating!
                      ? 'bg-orange-400 dark:bg-orange-500'
                      : 'bg-muted-foreground/15'
                  }`}
                />
              ))}
            </span>
          </span>
        )}
        {item.last_practiced_at && (
          <span className="tabular-nums" title="Last practiced">
            {new Date(item.last_practiced_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary"
          onClick={handleAddToLesson}
          disabled={isPending}
          title="Add to next lesson"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CalendarPlus className="h-3.5 w-3.5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-primary"
          onClick={onEditConfig}
          title="Edit configuration"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
