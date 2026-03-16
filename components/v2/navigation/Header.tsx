'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Guitar } from 'lucide-react';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { NotificationBell } from '@/components/notifications';

interface HeaderV2Props {
  user: { id?: string; email?: string } | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
}

export function HeaderV2({ user, isAdmin, isTeacher, isStudent }: HeaderV2Props) {
  if (!user) return null;

  const roleLabel = isAdmin ? 'Admin' : isTeacher ? 'Teacher' : isStudent ? 'Student' : 'User';

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'h-14 bg-background/80 backdrop-blur-xl',
        'border-b border-border/50',
        'pt-[env(safe-area-inset-top)]',
      )}
    >
      <div className="h-full px-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Guitar className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="hidden xs:block">
            <h1 className="font-semibold text-sm leading-tight">Strummy</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">{roleLabel}</p>
          </div>
        </Link>

        <div className="flex items-center gap-1.5">
          <NotificationBell userId={user?.id} />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
