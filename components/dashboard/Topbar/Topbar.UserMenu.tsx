'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';

interface TopbarUserMenuProps {
  email: string;
  fullName?: string | null;
}

function initialsFor(name: string | null | undefined, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? 'U';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

export function TopbarUserMenu({ email, fullName }: TopbarUserMenuProps) {
  const router = useRouter();

  async function handleSignOut(): Promise<void> {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch {
      // Sign-out failures are non-critical; redirect anyway.
    }
    router.push('/sign-in');
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2 px-2"
          data-testid="topbar-user-menu-trigger"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs">{initialsFor(fullName, email)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm md:inline">{fullName || email}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{fullName || 'Account'}</span>
            <span className="text-muted-foreground text-xs">{email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" data-testid="topbar-profile-link">
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleSignOut} data-testid="topbar-signout">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
