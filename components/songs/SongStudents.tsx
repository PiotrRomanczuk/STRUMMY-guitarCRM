'use client';

import { SongStudentItem } from '@/app/dashboard/songs/[id]/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { SONG_STATUS_DESCRIPTIONS } from '@/lib/constants';
import Link from 'next/link';

type Props = {
  students: SongStudentItem[];
};

const STATUS_GROUPS = {
  Mastered: ['mastered'],
  'In Progress': ['started', 'remembered', 'with_author'],
  'To Learn': ['to_learn'],
};

const STATUS_COLORS: Record<string, string> = {
  mastered: 'bg-green-500 hover:bg-green-600',
  started: 'bg-blue-500 hover:bg-blue-600',
  remembered: 'bg-yellow-500 hover:bg-yellow-600',
  with_author: 'bg-purple-500 hover:bg-purple-600',
  to_learn: 'bg-gray-500 hover:bg-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  mastered: 'Mastered',
  with_author: 'Play Along',
  remembered: 'Remembered',
  started: 'Started',
  to_learn: 'To Learn',
};

export function SongStudents({ students }: Props) {
  const groupedStudents = {
    Mastered: students.filter((item) => STATUS_GROUPS.Mastered.includes(item.status)),
    'In Progress': students.filter((item) => STATUS_GROUPS['In Progress'].includes(item.status)),
    'To Learn': students.filter((item) => STATUS_GROUPS['To Learn'].includes(item.status)),
  };

  return (
    <div className="space-y-6">
      {(Object.keys(groupedStudents) as Array<keyof typeof groupedStudents>).map((group) => {
        const groupStudents = groupedStudents[group];
        if (groupStudents.length === 0) return null;

        return (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {group} ({groupStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupStudents.map((student) => (
                  <Link
                    href={`/dashboard/users/${student.studentId}`}
                    key={student.studentId}
                    className="block"
                  >
                    <div className="flex flex-col justify-between rounded-lg border p-3 shadow-sm hover:bg-accent transition-colors">
                      <div>
                        <h4 className="font-medium">{student.name}</h4>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className={STATUS_COLORS[student.status] || 'bg-gray-500'}>
                              {STATUS_LABELS[student.status] || student.status.replace('_', ' ')}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {SONG_STATUS_DESCRIPTIONS[student.status as keyof typeof SONG_STATUS_DESCRIPTIONS] || student.status}
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-xs text-muted-foreground">
                          {new Date(student.lastPlayed).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {students.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No students have this song in their repertoire yet.
        </div>
      )}
    </div>
  );
}
