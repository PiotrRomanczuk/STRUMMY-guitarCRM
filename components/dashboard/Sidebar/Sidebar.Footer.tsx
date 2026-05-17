'use client';

import { LogOut } from 'lucide-react';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { createClient } from '@/lib/supabase/client';

interface SidebarFooterProps {
  email: string;
  fullName?: string | null;
  roleLabel: string;
}

function getInitials(fullName?: string | null, email?: string): string {
  if (fullName && fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  }
  return (email?.[0] ?? '?').toUpperCase();
}

export function SidebarFooter({ email, fullName, roleLabel }: SidebarFooterProps) {
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/sign-in';
  };

  const initials = getInitials(fullName, email);
  const displayName = fullName?.trim() || email;

  return (
    <div className="border-t px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className="bg-primary/15 text-primary grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium">{displayName}</p>
          <p className="text-muted-foreground truncate text-[10.5px] uppercase tracking-wider">
            {roleLabel}
          </p>
        </div>
        <ModeToggle />
        <button
          onClick={handleSignOut}
          aria-label="Sign out"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 grid size-7 place-items-center rounded-md transition-colors"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
