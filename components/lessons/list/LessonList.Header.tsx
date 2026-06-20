'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Download, CalendarDays, MoreHorizontal } from 'lucide-react';
import { ExportButton } from '@/components/shared/export-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LessonListHeaderProps {
  role?: 'admin' | 'teacher' | 'student';
}

export default function LessonListHeader({ role = 'admin' }: LessonListHeaderProps) {
  const router = useRouter();
  const canEdit = role === 'admin' || role === 'teacher';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 opacity-0 animate-fade-in">
      <div className="space-y-1">
        <h1 data-testid="page-title" className="text-2xl sm:text-3xl font-bold tracking-tight">
          Lessons
        </h1>
        <p className="text-sm text-muted-foreground">Manage your lessons and schedule</p>
      </div>
      {canEdit && (
        <>
          {/* Desktop: all buttons visible */}
          <div className="hidden sm:flex flex-row gap-2">
            <Link href="/dashboard/calendar">
              <Button variant="outline" className="gap-2">
                <CalendarDays className="w-4 h-4" />
                Calendar View
              </Button>
            </Link>
            <ExportButton endpoint="/api/lessons/export" />
            <Link href="/dashboard/lessons/import">
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Import
              </Button>
            </Link>
          </div>

          {/* Mobile: primary CTA + dropdown for secondary */}
          <div className="flex sm:hidden gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push('/dashboard/calendar')}>
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Calendar View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/dashboard/lessons/import')}>
                  <Download className="w-4 h-4 mr-2" />
                  Import
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  );
}
