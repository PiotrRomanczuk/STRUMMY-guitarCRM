'use client';

import { useState, useEffect } from 'react';
import { Check, Loader2, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAssignableLessons, type AssignableLesson } from '@/app/dashboard/lessons/actions';
import { quickAssignSongToLesson } from '@/app/actions/songs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface QuickAssignDialogProps {
  isOpen: boolean;
  song: {
    id: string;
    title: string | null;
    author: string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = [
  { value: 'to_learn', label: 'To Learn' },
  { value: 'started', label: 'Started' },
  { value: 'remembered', label: 'Remembered' },
  { value: 'with_author', label: 'Play Along' },
  { value: 'mastered', label: 'Mastered' },
];

export default function QuickAssignDialog({
  isOpen,
  song,
  onClose,
  onSuccess,
}: QuickAssignDialogProps) {
  const [lessons, setLessons] = useState<AssignableLesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<AssignableLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('to_learn');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  // Fetch lessons on mount
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getAssignableLessons()
        .then((data) => {
          setLessons(data);
          setFilteredLessons(data);
        })
        .catch((error) => {
          logger.error('Failed to fetch lessons:', error);
          toast.error('Failed to load lessons');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Filter lessons by search and date filter
  useEffect(() => {
    let filtered = lessons;

    // Filter by search query (student name or lesson title)
    if (searchQuery) {
      filtered = filtered.filter((lesson) => {
        const studentName = lesson.student?.full_name?.toLowerCase() || '';
        const lessonTitle = lesson.title?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return studentName.includes(query) || lessonTitle.includes(query);
      });
    }

    // Filter by date (upcoming vs past)
    if (filter !== 'all') {
      const now = new Date();
      filtered = filtered.filter((lesson) => {
        const lessonDate = new Date(lesson.scheduled_at);
        return filter === 'upcoming' ? lessonDate >= now : lessonDate < now;
      });
    }

    setFilteredLessons(filtered);
  }, [searchQuery, filter, lessons]);

  const handleAssign = async () => {
    if (!selectedLessonId) {
      toast.error('Please select a lesson');
      return;
    }

    setAssigning(true);

    try {
      const result = await quickAssignSongToLesson(song.id, selectedLessonId, selectedStatus);

      if (!result.success) {
        toast.error(result.error || 'Failed to assign song');
        return;
      }

      if (result.isUpdate) {
        toast.success(`Updated status for "${song.title}" in lesson`);
      } else {
        toast.success(`"${song.title}" assigned to lesson`);
      }

      onSuccess();
      onClose();
    } catch (error) {
      logger.error('Error assigning song:', error);
      toast.error('Failed to assign song');
    } finally {
      setAssigning(false);
    }
  };

  const formatLessonDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow =
      date.toDateString() === new Date(now.getTime() + 86400000).toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quick Assign to Lesson</DialogTitle>
          <DialogDescription>
            Assign &quot;{song.title ?? 'Untitled'}&quot; by {song.author || 'Unknown Artist'} to a lesson
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            {(['all', 'upcoming', 'past'] as const).map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterOption)}
                className="capitalize"
              >
                {filterOption}
              </Button>
            ))}
          </div>

          {/* Lesson Selector */}
          <div className="space-y-2">
            <Label htmlFor="lesson">Lesson</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {searchQuery || filter !== 'all'
                  ? 'No lessons found matching your filters'
                  : 'No lessons available'
                }
              </p>
            ) : (
              <div className="max-h-[200px] overflow-y-auto border rounded-md">
                {filteredLessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setSelectedLessonId(lesson.id)}
                    className={cn(
                      'w-full p-3 text-left hover:bg-accent transition-colors flex items-center justify-between',
                      selectedLessonId === lesson.id && 'bg-accent'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {lesson.student?.full_name || 'Unknown Student'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatLessonDate(lesson.scheduled_at)}
                        {lesson.title && ` • ${lesson.title}`}
                      </div>
                    </div>
                    {selectedLessonId === lesson.id && (
                      <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Selector */}
          <div className="space-y-2">
            <Label htmlFor="status">Initial Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={assigning}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedLessonId || assigning}>
            {assigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Song
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
