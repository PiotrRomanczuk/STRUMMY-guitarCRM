'use client';

import Link from 'next/link';
import { LessonWithProfiles } from '@/schemas/LessonSchema';
import { formatDate, formatTime } from './LessonTable.helpers';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import StatusBadge, { getStatusVariant } from '@/components/shared/StatusBadge';

interface Props {
  lesson: LessonWithProfiles;
  showTeacherColumn: boolean;
  showActions: boolean;
  baseUrl: string;
}

export default function LessonTableRow({ lesson, showTeacherColumn, showActions, baseUrl }: Props) {
  const songs = lesson.lesson_songs?.map((ls) => ls.song?.title).filter(Boolean) || [];
  const assignments = lesson.assignments?.map((a) => a.title) || [];
  const hasContent = songs.length > 0 || assignments.length > 0;

  // Use date if available, otherwise fall back to scheduled_at
  const displayDate = lesson.date ?? lesson.scheduled_at ?? null;
  const displayTime = lesson.start_time ?? lesson.scheduled_at ?? null;

  return (
    <TableRow
      className="relative group hover:bg-secondary/50 border-border transition-colors"
      data-testid="lesson-row"
    >
      <TableCell className="relative font-medium">
        <Link
          href={`${baseUrl}/${lesson.id}`}
          className="absolute inset-0 z-0"
          aria-label={`View ${lesson.title || 'lesson'}`}
        />
        <div className="text-foreground">
          {lesson.title || 'Untitled Lesson'}
        </div>

        {hasContent && (
          <div className="absolute left-4 top-full mt-1 z-50 hidden group-hover:block w-64 p-4 bg-card rounded-lg shadow-xl border border-border">
            {songs.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Songs
                </h4>
                <ul className="list-disc list-inside text-xs text-foreground">
                  {songs.slice(0, 3).map((song, i) => (
                    <li key={i} className="truncate">
                      {song}
                    </li>
                  ))}
                  {songs.length > 3 && (
                    <li className="text-muted-foreground italic">+{songs.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
            {assignments.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Assignments
                </h4>
                <ul className="list-disc list-inside text-xs text-foreground">
                  {assignments.slice(0, 3).map((assignment, i) => (
                    <li key={i} className="truncate">
                      {assignment}
                    </li>
                  ))}
                  {assignments.length > 3 && (
                    <li className="text-muted-foreground italic">+{assignments.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        {lesson.profile ? lesson.profile.full_name || lesson.profile.email : 'Unknown Student'}
      </TableCell>
      {showTeacherColumn && (
        <TableCell>
          {lesson.teacher_profile
            ? lesson.teacher_profile.full_name || lesson.teacher_profile.email
            : 'Unknown Teacher'}
        </TableCell>
      )}
      <TableCell>{formatDate(displayDate)}</TableCell>
      <TableCell>{formatTime(displayTime)}</TableCell>
      <TableCell>
        <StatusBadge variant={getStatusVariant(lesson.status)}>
          {lesson.status || 'SCHEDULED'}
        </StatusBadge>
      </TableCell>
      {showActions && (
        <TableCell className="relative z-10" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`${baseUrl}/${lesson.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              View
            </Link>
          </Button>
        </TableCell>
      )}
    </TableRow>
  );
}
