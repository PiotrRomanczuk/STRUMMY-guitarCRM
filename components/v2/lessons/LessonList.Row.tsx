import Link from 'next/link';
import { Eye, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import {
  formatLessonDate,
  formatLessonTime,
  getLessonStatusStyle,
  getLessonStatusLabel,
} from './lesson.helpers';
import type { LessonWithProfiles } from '@/schemas/LessonSchema';

interface DesktopRowProps {
  lesson: LessonWithProfiles;
  showTeacherColumn: boolean;
  showActions: boolean;
}

export function DesktopRow({
  lesson,
  showTeacherColumn,
  showActions,
}: DesktopRowProps) {
  const displayDate = lesson.date ?? lesson.scheduled_at ?? null;
  const displayTime = lesson.start_time ?? lesson.scheduled_at ?? null;

  return (
    <TableRow className="hover:bg-muted/50 transition-colors border-border">
      <TableCell>
        <Link
          href={`/dashboard/lessons/${lesson.id}`}
          className="font-medium text-foreground hover:text-primary"
        >
          {lesson.title || 'Untitled Lesson'}
        </Link>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {lesson.profile?.full_name || lesson.profile?.email || 'Unknown'}
      </TableCell>
      {showTeacherColumn && (
        <TableCell className="text-sm text-muted-foreground">
          {lesson.teacher_profile?.full_name ||
            lesson.teacher_profile?.email ||
            'Unknown'}
        </TableCell>
      )}
      <TableCell className="text-sm text-muted-foreground">
        {formatLessonDate(displayDate)}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatLessonTime(displayTime)}
      </TableCell>
      <TableCell>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5',
            'text-xs font-medium border',
            getLessonStatusStyle(lesson.status)
          )}
        >
          {getLessonStatusLabel(lesson.status)}
        </span>
      </TableCell>
      {showActions && (
        <TableCell>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/lessons/${lesson.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/lessons/${lesson.id}/edit`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}
